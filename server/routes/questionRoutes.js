const express = require('express');
const router = express.Router();
const { getSessionQuestions, createQuestion } = require('../controllers/questionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createQuestion);

router.route('/:sessionId')
  .get(protect, getSessionQuestions);

module.exports = router;
