const express = require('express');
const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');

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
// GET /api/user/profile
// ================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ================================
// PUT /api/user/update-name
// ================================
router.put('/update-name', authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Valid name required.' });
    }
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: name.trim() },
      { new: true }
    ).select('-password');
    res.status(200).json({ success: true, user, message: 'Name updated successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ================================
// PUT /api/user/update-password
// ================================
router.put('/update-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Both passwords required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.userId);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
