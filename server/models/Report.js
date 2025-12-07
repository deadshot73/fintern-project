const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema({
  type: String, // 'text', 'table', 'graph', 'latex'
  content: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

const entitySchema = new mongoose.Schema({
  serialNumber: Number, // Starting from 1
  userMessage: {
    type: String,
    required: true
  },
  aiMessages: [aiMessageSchema] // Array of AI message components
});

const reportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  selectedEntities: [entitySchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);

