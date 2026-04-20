const Result = require('../models/Result');
const Session = require('../models/Session');
const { evaluateAnswer, generateFollowUp } = require('../services/aiService');

// @desc    Save a result for a specific question
// @route   POST /api/results
// @access  Private
const saveResult = async (req, res) => {
  try {
    const { 
      sessionId, 
      questionId, 
      questionText, 
      answerText, 
      timeTaken,
      questionType,
      language,
      followUpQuestion,
      followUpAnswer,
      integrityData
    } = req.body;

    if (!sessionId || !questionId) {
      return res.status(400).json({ message: 'Session ID and Question ID are required' });
    }

    // Verify session belongs to user
    const session = await Session.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized for this session' });
    }

    // Get AI evaluation for the answer (pass questionType, language, integrity data, and follow-up)
    const aiEvaluation = await evaluateAnswer(
      questionText, 
      answerText, 
      questionType || 'text', 
      language || 'none',
      integrityData || null,
      followUpQuestion || null,
      followUpAnswer || null
    );

    // Upsert the result (in case they retry a question)
    const result = await Result.findOneAndUpdate(
      { sessionId, questionId, userId: req.user.id },
      {
        questionText,
        answerText,
        scores: aiEvaluation.scores,
        aiFeedback: aiEvaluation.aiFeedback,
        timeTaken,
        followUpQuestion: followUpQuestion || null,
        followUpAnswer: followUpAnswer || null,
      },
      { returnDocument: 'after', upsert: true }
    );

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error saving result' });
  }
};

// @desc    Generate a follow-up question based on Q&A
// @route   POST /api/results/follow-up
// @access  Private
const getFollowUp = async (req, res) => {
  try {
    const { questionText, answerText } = req.body;

    if (!questionText || !answerText) {
      return res.status(400).json({ message: 'Question and answer text are required' });
    }

    const followUpQuestion = await generateFollowUp(questionText, answerText);
    res.status(200).json({ followUpQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error generating follow-up question' });
  }
};

// @desc    Get all results for a specific session
// @route   GET /api/results/session/:sessionId
// @access  Private
const getSessionResults = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session belongs to user
    const session = await Session.findById(sessionId);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized for this session' });
    }

    const results = await Result.find({ sessionId, userId: req.user.id });
    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching results' });
  }
};

module.exports = {
  saveResult,
  getFollowUp,
  getSessionResults
};
