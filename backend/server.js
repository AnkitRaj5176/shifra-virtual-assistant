const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');

// Load environment variables
dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ================================
// MIDDLEWARE
// ================================
app.use(cors({
  origin: '*', // Allow all origins (file://, localhost, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());           // Parse JSON body
app.use(express.urlencoded({ extended: true }));

// Serve frontend files statically
app.use(express.static(path.join(__dirname, '..')));

// ================================
// ROUTES
// ================================
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/user',     require('./routes/user'));
app.use('/api/launcher', require('./routes/launcher'));
app.use('/api/tabs',     require('./routes/tabs'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Shifra Backend is running!',
    time: new Date().toLocaleString(),
  });
});

// Serve login page as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// ================================
// MONGODB CONNECTION
// ================================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
    app.listen(PORT, () => {
      console.log(`🚀 Shifra Backend running at: http://localhost:${PORT}`);
      console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    console.error('Make sure MongoDB is running on your machine.');
    process.exit(1);
  });
