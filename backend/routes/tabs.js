const express = require('express');
const jwt     = require('jsonwebtoken');
const router  = express.Router();

// Auth middleware — only for frontend requests
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });
  try {
    jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch { return res.status(401).json({ message: 'Invalid token' }); }
}

// In-memory queue
let pendingCommands = [];
let results         = {};

// ── POST /api/tabs/command  (Shifra frontend → backend)
router.post('/command', auth, (req, res) => {
  const { action, key, url, name } = req.body;
  const id = Date.now() + Math.random();

  pendingCommands.push({ id, action, key, url: url || '', name });
  console.log(`[TABS] Command queued: ${action} ${name}`);

  // Wait up to 5s for extension to process
  const deadline = Date.now() + 5000;
  const check = setInterval(() => {
    if (results[id] !== undefined) {
      clearInterval(check);
      const r = results[id];
      delete results[id];
      console.log(`[TABS] Result: ${JSON.stringify(r)}`);
      return res.json(r);
    }
    if (Date.now() > deadline) {
      clearInterval(check);
      pendingCommands = pendingCommands.filter(c => c.id !== id);
      console.log(`[TABS] Timeout — extension not responding`);
      return res.json({ success: false, message: 'Extension not responding. Please reload the extension from chrome://extensions.' });
    }
  }, 100);
});

// ── GET /api/tabs/poll  (Extension polls — NO auth needed)
router.get('/poll', (req, res) => {
  if (pendingCommands.length > 0) {
    const cmd = pendingCommands.shift();
    console.log(`[TABS] Sending to extension: ${cmd.action} ${cmd.name}`);
    return res.json({ hasCommand: true, ...cmd });
  }
  res.json({ hasCommand: false });
});

// ── POST /api/tabs/result  (Extension sends result — NO auth needed)
router.post('/result', (req, res) => {
  const { id, success, message } = req.body;
  console.log(`[TABS] Got result for ${id}: ${success} - ${message}`);
  results[id] = { success, message };
  res.json({ ok: true });
});

module.exports = router;
