const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  isAIGenerated: {
    type: Boolean,
    default: true,
  },
  // New fields for coding/bugfix question types
  type: {
    type: String,
    enum: ['text', 'coding', 'bugfix'],
    default: 'text',
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'none'],
    default: 'none',
  },
  starterCode: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Question', questionSchema);
