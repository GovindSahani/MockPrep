const Session = require('../models/Session');
const Question = require('../models/Question');
const { selectQuestions } = require('../data/questionBank');

// @desc    Start a new mock interview session
// @route   POST /api/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const { role, difficulty } = req.body;

    if (!role || !difficulty) {
      return res.status(400).json({ message: 'Please provide role and difficulty' });
    }

    const session = await Session.create({
      userId: req.user.id,
      role,
      difficulty,
      status: 'active'
    });

    // ── Randomized question selection ──
    // Get previously seen questions for this user
    const previousSessions = await Session.find({ userId: req.user.id, status: 'completed' }).select('_id');
    const previousSessionIds = previousSessions.map(s => s._id);
    const previousQuestions = await Question.find({ sessionId: { $in: previousSessionIds } }).select('text');
    const excludeTexts = previousQuestions.map(q => q.text);

    // Select 5 random questions from the bank
    const selected = selectQuestions(role, difficulty, excludeTexts, 5);

    // Build question documents
    const questionDocs = selected.map((q, idx) => ({
      sessionId: session._id,
      text: q.text,
      timeLimit: 120,
      order: idx + 1,
      isAIGenerated: true,
      type: q.type,
      language: q.language,
      starterCode: q.starterCode,
    }));

    await Question.insertMany(questionDocs);

    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating session' });
  }
};

// @desc    Get user's past sessions
// @route   GET /api/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.id }).sort('-startedAt');
    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching sessions' });
  }
};

// @desc    Get a single session details
// @route   GET /api/sessions/:id
// @access  Private
const getSessionById = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if the session belongs to the user
    if (session.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to view this session' });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching session' });
  }
};

// @desc    Mark a session as completed with integrity data
// @route   PUT /api/sessions/:id/complete
// @access  Private
const completeSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Check if the session belongs to the user
    if (session.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // ── Integrity data from frontend ──
    const {
      tabSwitchCount = 0,
      tabSwitchLog = [],
      pasteLog = [],
      timeLog = [],
    } = req.body || {};

    // ── Calculate integrity score ──
    let integrityScore = 100;
    integrityScore -= (tabSwitchCount * 10);
    integrityScore -= (pasteLog.length * 5);

    // Deduct for suspiciously fast answers (< 20 seconds)
    const fastAnswers = timeLog.filter(t => t.timeTakenSeconds < 20).length;
    integrityScore -= (fastAnswers * 3);

    // Floor at 0
    integrityScore = Math.max(0, integrityScore);

    // Determine if flagged
    const flagged = integrityScore < 50 || tabSwitchCount >= 5;
    let flagReason = null;
    if (flagged) {
      const reasons = [];
      if (tabSwitchCount >= 5) reasons.push('Excessive tab switches');
      if (pasteLog.length > 3) reasons.push('Multiple paste events');
      if (fastAnswers > 2) reasons.push('Suspiciously fast answers');
      if (integrityScore < 50) reasons.push('Low integrity score');
      flagReason = reasons.join('; ') || 'Session flagged due to suspicious activity';
    }

    session.status = 'completed';
    session.completedAt = Date.now();
    session.tabSwitchCount = tabSwitchCount;
    session.tabSwitchLog = tabSwitchLog;
    session.pasteLog = pasteLog;
    session.timeLog = timeLog;
    session.integrityScore = integrityScore;
    session.flagged = flagged;
    session.flagReason = flagReason;

    const updatedSession = await session.save();

    res.status(200).json(updatedSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error marking session complete' });
  }
};

module.exports = {
  createSession,
  getSessions,
  getSessionById,
  completeSession
};
