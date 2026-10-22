const { app, Tray, Menu, nativeImage, shell, dialog } = require('electron');
const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');
const net       = require('net');

let tray           = null;
let backendProcess = null;

const isDev      = !app.isPackaged;
const backendDir = isDev
  ? path.join(__dirname, '..', 'backend')
  : path.join(process.resourcesPath, 'backend');

// ── Check if port is in use ─────────────────
function isPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net.createConnection({ port }, () => {
      tester.destroy();
      resolve(true);  // port in use
    });
    tester.on('error', () => resolve(false)); // port free
  });
}

// ── Start Backend ──────────────────────────
async function startBackend() {
  const serverPath = path.join(backendDir, 'server.js');
  const inUse      = await isPortInUse(5000);

  if (inUse) {
    console.log('[Shifra] Backend already running on port 5000.');
    return;
  }

  if (!fs.existsSync(serverPath)) {
    dialog.showErrorBox('Shifra Error', 'Backend server not found. Please reinstall.');
    return;
  }

  console.log('[Shifra] Starting backend...');
  backendProcess = spawn('node', [serverPath], {
    cwd:         backendDir,
    env:         { ...process.env },
    windowsHide: true,
  });

  backendProcess.stdout.on('data', (d) => console.log('[Backend]', d.toString().trim()));
  backendProcess.stderr.on('data', (d) => console.error('[Backend ERR]', d.toString().trim()));
}

// ── Open Shifra in Chrome ──────────────────
function openInBrowser() {
  shell.openExternal('http://localhost:5000/login.html');
}

// ── Wait for backend then open ─────────────
async function waitAndOpen() {
  let tries = 0;
  const interval = setInterval(async () => {
    tries++;
    const ready = await isPortInUse(5000);
    if (ready) {
      clearInterval(interval);
      console.log('[Shifra] Backend ready! Opening browser...');
      openInBrowser();
    }
    if (tries > 15) {
      clearInterval(interval);
      dialog.showErrorBox('Shifra Error', 'Backend failed to start. Make sure MongoDB is running.');
    }
  }, 1000);
}

// ── System Tray ────────────────────────────
function createTray() {
  const iconPath = path.join(__dirname, 'icon.ico');
  const icon     = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath)
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('Shifra Virtual Assistant — Running');

  const menu = Menu.buildFromTemplate([
    {
      label: '🤖 Open Shifra',
      click: () => openInBrowser(),
    },
    { type: 'separator' },
    {
      label: '🔁 Restart Backend',
      click: async () => {
        if (backendProcess) {
          backendProcess.kill();
          backendProcess = null;
        }
        await startBackend();
        setTimeout(openInBrowser, 3000);
      },
    },
    { type: 'separator' },
    {
      label: '❌ Quit Shifra',
      click: () => {
        tray.destroy();
        if (backendProcess) backendProcess.kill();
        app.exit(0);
      },
    },
  ]);

  tray.setContextMenu(menu);

  // Single click → open browser
  tray.on('click', () => openInBrowser());

  // Show balloon notification
  tray.displayBalloon({
    iconType: 'info',
    title:    'Shifra is Running!',
    content:  'Click the tray icon to open Shifra in your browser.',
  });
}

// ── App Start ──────────────────────────────
app.whenReady().then(async () => {
  // Hide dock/taskbar — runs as tray app
  app.setAppUserModelId('Shifra Virtual Assistant');

  createTray();
  await startBackend();
  await waitAndOpen();
});

// Keep running even if no windows open
app.on('window-all-closed', () => {
  // Do nothing — stay in tray
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
