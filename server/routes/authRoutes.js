const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  googleLogin,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);

module.exports = router;
