const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: String, // 'user' or 'bot'
  type: { type: String, default: 'text' }, // 'text', 'render_plan', etc.
  content: mongoose.Schema.Types.Mixed,    // can be string, object, array
  timestamp: { type: Date, default: Date.now }
});

const chatSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
