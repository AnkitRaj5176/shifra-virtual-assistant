const mongoose = require('mongoose');

// ================================
// CHAT MESSAGE SCHEMA
// ================================
const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Chat', chatSchema);
