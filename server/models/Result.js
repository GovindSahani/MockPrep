const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  questionText: String,
  answerText: String,
  scores: {
    technical: { type: Number, min: 0, max: 100 },
    communication: { type: Number, min: 0, max: 100 },
    depth: { type: Number, min: 0, max: 100 },
    examples: { type: Number, min: 0, max: 100 },
    overall: { type: Number, min: 0, max: 100 },
  },
  aiFeedback: String,
  idealAnswer: String,
  timeTaken: Number,
  // ── Follow-up question fields ──
  followUpQuestion: String,
  followUpAnswer: String,
});

module.exports = mongoose.model('Result', resultSchema);
