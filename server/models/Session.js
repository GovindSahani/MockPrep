const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['frontend', 'backend', 'fullstack', 'dsa', 'hr'],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  // ── Integrity / Anti-cheat fields ──
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  tabSwitchLog: [{
    timestamp: String,
    switchNumber: Number,
  }],
  pasteLog: [{
    timestamp: String,
    questionIndex: Number,
    pastedLength: Number,
  }],
  timeLog: [{
    questionIndex: Number,
    timeTakenSeconds: Number,
  }],
  integrityScore: {
    type: Number,
    default: 100,
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  flagReason: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('Session', sessionSchema);
