const Question = require('../models/Question');

// @desc    Get questions by session ID
// @route   GET /api/questions/:sessionId
// @access  Private
const getSessionQuestions = async (req, res) => {
  try {
    const questions = await Question.find({ sessionId: req.params.sessionId }).sort('order');
    res.status(200).json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching questions' });
  }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private
const createQuestion = async (req, res) => {
  try {
    const { sessionId, text, timeLimit, order, isAIGenerated, type, language, starterCode } = req.body;

    if (!sessionId || !text || !timeLimit || order === undefined) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const question = await Question.create({
      sessionId,
      text,
      timeLimit,
      order,
      isAIGenerated,
      type: type || 'text',
      language: language || 'none',
      starterCode: starterCode || null
    });

    res.status(201).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating question' });
  }
};

module.exports = {
  getSessionQuestions,
  createQuestion
};
