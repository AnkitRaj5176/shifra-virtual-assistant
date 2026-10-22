const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');

const router = express.Router();

// ================================
// HELPER: Generate JWT Token
// ================================
function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // token valid for 7 days
  });
}

// ================================
// POST /api/auth/register
// ================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'This email is already registered. Please login.' });
    }

    // Create new user (password gets hashed via pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ================================
// POST /api/auth/login
// ================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ================================
// GET /api/auth/verify
// (Check if token is still valid)
// ================================
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: 'No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ valid: false, message: 'User not found.' });
    }

    res.status(200).json({
      valid: true,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token.' });
  }
});

module.exports = router;
