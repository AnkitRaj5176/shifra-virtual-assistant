const express      = require('express');
const { exec }     = require('child_process');
const jwt          = require('jsonwebtoken');

const router = express.Router();

// ================================
// AUTH MIDDLEWARE
// ================================
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch { return res.status(401).json({ message: 'Invalid token' }); }
}

// ================================
// ALLOWED APPS MAP (Windows)
// Only whitelisted apps can be opened for security
// ================================
const APPS = {
  // ── System Apps ──
  notepad:        'notepad.exe',
  calculator:     'calc.exe',
  paint:          'mspaint.exe',
  wordpad:        'wordpad.exe',
  'task manager': 'taskmgr.exe',
  taskmanager:    'taskmgr.exe',
  snipping:       'snippingtool.exe',
  camera:         'start microsoft.windows.camera:',
  clock:          'start ms-clock:',
  calendar:       'start outlookcal:',
  settings:       'start ms-settings:',
  'file explorer':'explorer.exe',
  explorer:       'explorer.exe',
  cmd:            'start cmd.exe',
  powershell:     'start powershell.exe',

  // ── Office Apps ──
  word:           'start winword.exe',
  excel:          'start excel.exe',
  powerpoint:     'start powerpnt.exe',

  // ── Media ──
  vlc:            'start vlc.exe',
  'windows media player': 'start wmplayer.exe',
  spotify:        'start spotify:',

  // ── Dev Tools ──
  'vs code':      'start code',
  vscode:         'start code',
  'visual studio code': 'start code',

  // ── Browsers ──
  chrome:         'start chrome.exe',
  firefox:        'start firefox.exe',
  edge:           'start msedge.exe',

  // ── Communication ──
  teams:          'start msteams:',
  zoom:           'start zoommtg:',
  skype:          'start skype:',
};

// ================================
// POST /api/launcher/open
// Body: { app: "notepad" }
// ================================
router.post('/open', auth, (req, res) => {
  const { app } = req.body;
  if (!app) return res.status(400).json({ message: 'App name required.' });

  const key     = app.toLowerCase().trim();
  const command = APPS[key];

  if (!command) {
    return res.status(404).json({
      message: `App "${app}" is not in the allowed list.`,
      available: Object.keys(APPS),
    });
  }

  exec(command, (error) => {
    if (error) {
      console.error(`Launch error for "${app}":`, error.message);
      return res.status(500).json({
        message: `Could not open ${app}. Make sure it is installed.`,
      });
    }
    res.json({ success: true, message: `${app} opened successfully.` });
  });
});

// ================================
// APP → PROCESS NAME MAP (for taskkill)
// ================================
const APP_PROCESS = {
  notepad:        'notepad.exe',
  calculator:     'calculatorapp.exe',
  paint:          'mspaint.exe',
  wordpad:        'wordpad.exe',
  'task manager': 'taskmgr.exe',
  taskmanager:    'taskmgr.exe',
  snipping:       'snippingtool.exe',
  camera:         'windowscamera.exe',
  'file explorer':'explorer.exe',
  explorer:       'explorer.exe',
  cmd:            'cmd.exe',
  powershell:     'powershell.exe',
  word:           'winword.exe',
  excel:          'excel.exe',
  powerpoint:     'powerpnt.exe',
  vlc:            'vlc.exe',
  'windows media player': 'wmplayer.exe',
  spotify:        'spotify.exe',
  'vs code':      'code.exe',
  vscode:         'code.exe',
  'visual studio code': 'code.exe',
  chrome:         'chrome.exe',
  firefox:        'firefox.exe',
  edge:           'msedge.exe',
  teams:          'teams.exe',
  skype:          'skype.exe',
  zoom:           'zoom.exe',
};

// ================================
// POST /api/launcher/close
// Body: { app: "notepad" }
// ================================
router.post('/close', auth, (req, res) => {
  const { app } = req.body;
  if (!app) return res.status(400).json({ message: 'App name required.' });

  const key     = app.toLowerCase().trim();
  const process = APP_PROCESS[key];

  if (!process) {
    return res.status(404).json({ message: `Cannot close "${app}". Not in the list.` });
  }

  exec(`taskkill /F /IM "${process}"`, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ message: `${app} is not running or could not be closed.` });
    }
    res.json({ success: true, message: `${app} closed successfully.` });
  });
});

// ================================
// POST /api/launcher/openurl
// Opens a URL in default browser (for Electron app)
// ================================
router.post('/openurl', auth, (req, res) => {
  const { url, name } = req.body;
  if (!url) return res.status(400).json({ message: 'URL required.' });

  exec(`start "" "${url}"`, (error) => {
    if (error) {
      return res.status(500).json({ message: `Could not open ${name || url}.` });
    }
    res.json({ success: true, message: `Opening ${name || url}.` });
  });
});

// ================================
// POST /api/launcher/power
// Body: { action: "shutdown" | "restart" | "sleep" | "cancel" }
// ================================
router.post('/power', auth, (req, res) => {
  const { action } = req.body;

  const commands = {
    shutdown: 'shutdown /s /t 10 /c "Shutting down via Shifra..."',
    restart:  'shutdown /r /t 10 /c "Restarting via Shifra..."',
    sleep:    'rundll32.exe powrprof.dll,SetSuspendState 0,1,0',
    cancel:   'shutdown /a',
  };

  const cmd = commands[action];
  if (!cmd) {
    return res.status(400).json({ message: `Unknown power action: ${action}` });
  }

  exec(cmd, (error) => {
    if (error && action !== 'cancel') {
      return res.status(500).json({ message: `Could not execute ${action}.` });
    }
    const messages = {
      shutdown: 'Laptop will shut down in 10 seconds.',
      restart:  'Laptop will restart in 10 seconds.',
      sleep:    'Laptop is going to sleep.',
      cancel:   'Shutdown or restart has been cancelled.',
    };
    res.json({ success: true, message: messages[action] });
  });
});

// ================================
// GET /api/launcher/list
// ================================
router.get('/list', auth, (req, res) => {
  res.json({ success: true, apps: Object.keys(APPS) });
});

module.exports = router;
