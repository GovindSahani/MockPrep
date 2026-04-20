const express = require('express');
const router = express.Router();
const { saveResult, getFollowUp, getSessionResults } = require('../controllers/resultController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, saveResult);

router.route('/follow-up')
  .post(protect, getFollowUp);

router.route('/session/:sessionId')
  .get(protect, getSessionResults);

module.exports = router;
