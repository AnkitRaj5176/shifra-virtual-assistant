// ================================================
// SHIFRA EXTENSION - Background Service Worker
// Uses chrome.alarms to stay alive and poll backend
// ================================================

const BACKEND = 'http://localhost:5000/api/tabs';
const tabRegistry = {};

// ── Keep service worker alive with alarms ──
chrome.alarms.create('shifra-poll', { periodInMinutes: 1/60 }); // every ~1 sec

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'shifra-poll') poll();
});

// Also poll immediately on startup
poll();

console.log('[Shifra Extension] Ready. Polling backend...');

// ── Poll backend ──────────────────────────────
async function poll() {
  try {
    const res = await fetch(`${BACKEND}/poll`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (!data.hasCommand) return;

    console.log('[Shifra] Command received:', data.action, data.name);
    const result = await handleCommand(data);
    console.log('[Shifra] Result:', result);

    await fetch(`${BACKEND}/result`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: data.id, ...result }),
    });
  } catch(e) {
    // Backend not running — silent fail
  }
}

// ── Handle tab commands ───────────────────────
async function handleCommand({ action, key, url, name }) {

  // ── OPEN TAB ──
  if (action === 'openTab') {
    if (tabRegistry[key]) {
      try {
        const existing = await chrome.tabs.get(tabRegistry[key]);
        await chrome.tabs.update(existing.id, { active: true });
        await chrome.windows.update(existing.windowId, { focused: true });
        return { success: true, message: `${name} is already open.` };
      } catch(e) {
        delete tabRegistry[key];
      }
    }
    const tab = await chrome.tabs.create({ url });
    tabRegistry[key] = tab.id;
    console.log('[Shifra] Opened tab id:', tab.id, 'for', key);
    return { success: true, message: `Opening ${name}.` };
  }

  // ── CLOSE TAB ──
  if (action === 'closeTab') {
    // Method 1: use stored tab ID
    if (tabRegistry[key]) {
      try {
        await chrome.tabs.remove(tabRegistry[key]);
        delete tabRegistry[key];
        return { success: true, message: `${name} closed.` };
      } catch(e) {
        console.log('[Shifra] Stored tabId failed, trying URL match');
        delete tabRegistry[key];
      }
    }

    // Method 2: find by URL pattern
    const patterns = {
      youtube:       'youtube.com',
      google:        'google.com',
      whatsapp:      'web.whatsapp.com',
      gmail:         'mail.google.com',
      github:        'github.com',
      facebook:      'facebook.com',
      instagram:     'instagram.com',
      twitter:       'twitter.com',
      linkedin:      'linkedin.com',
      netflix:       'netflix.com',
      amazon:        'amazon.in',
      flipkart:      'flipkart.com',
      maps:          'maps.google.com',
      news:          'news.google.com',
      weather:       'google.com/search?q=weather',
      chatgpt:       'chat.openai.com',
      translate:     'translate.google.com',
      drive:         'drive.google.com',
      docs:          'docs.google.com',
      sheets:        'sheets.google.com',
      meet:          'meet.google.com',
      reddit:        'reddit.com',
      stackoverflow: 'stackoverflow.com',
      twitch:        'twitch.tv',
      pinterest:     'pinterest.com',
      songs:         'youtube.com',
    };

    const pattern = patterns[key];
    if (pattern) {
      const allTabs = await chrome.tabs.query({});
      console.log('[Shifra] Searching', allTabs.length, 'tabs for pattern:', pattern);
      const match = allTabs.find(t => t.url && t.url.includes(pattern));
      if (match) {
        console.log('[Shifra] Found tab:', match.id, match.url);
        await chrome.tabs.remove(match.id);
        return { success: true, message: `${name} closed.` };
      }
    }
    return { success: false, message: `${name} is not open.` };
  }

  return { success: false, message: 'Unknown action.' };
}
