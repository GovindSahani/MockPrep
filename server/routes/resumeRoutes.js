const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  upload,
  handleReviewResume,
  getReviewHistory,
  getReviewById,
} = require('../controllers/resumeController');

// POST /api/resume/review — upload + AI analysis
router.post('/review', protect, upload.single('resume'), handleReviewResume);

// GET /api/resume/history — list user's past reviews
router.get('/history', protect, getReviewHistory);

// GET /api/resume/:id — single review detail
router.get('/:id', protect, getReviewById);

module.exports = router;
