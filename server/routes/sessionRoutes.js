const express = require('express');
const router = express.Router();
const { 
  createSession, 
  getSessions, 
  getSessionById, 
  completeSession 
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createSession)
  .get(protect, getSessions);

router.route('/:id')
  .get(protect, getSessionById);

router.route('/:id/complete')
  .put(protect, completeSession);

module.exports = router;
