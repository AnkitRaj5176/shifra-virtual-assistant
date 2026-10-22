const express = require('express');
const jwt     = require('jsonwebtoken');
const Chat    = require('../models/Chat');

const router = express.Router();

// ================================
// MIDDLEWARE: Verify JWT Token
// ================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId    = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token.' });
  }
}

// ================================
// POST /api/chat/save
// Save a single chat message
// ================================
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const { sender, message } = req.body;
    if (!sender || !message) {
      return res.status(400).json({ message: 'sender and message required.' });
    }
    const chat = await Chat.create({ userId: req.userId, sender, message });
    res.status(201).json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ================================
// GET /api/chat/history
// Get last 50 messages of the user
// ================================
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.status(200).json({ success: true, chats: chats.reverse() });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ================================
// DELETE /api/chat/clear
// Clear all chat history for user
// ================================
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    await Chat.deleteMany({ userId: req.userId });
    res.status(200).json({ success: true, message: 'Chat history cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
