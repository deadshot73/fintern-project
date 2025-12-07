const mongoose = require('mongoose');

const summarySchema = new mongoose.Schema({
  name: String, // e.g., "summary_1_5"
  startEntity: Number,
  endEntity: Number,
  content: String, // The summary text
  createdAt: { type: Date, default: Date.now }
});

const aiMessageSchema = new mongoose.Schema({
  type: { type: String },
  content: mongoose.Schema.Types.Mixed
}, { _id: false });

const entitySchema = new mongoose.Schema({
  serialNumber: Number,
  userMessage: String,
  aiMessages: [aiMessageSchema]
});

const reportMetadataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportName: { type: String, required: true },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true },
  selectedEntities: [entitySchema],
  summaries: [summarySchema], // Summaries between consecutive entities
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReportMetadata', reportMetadataSchema);

