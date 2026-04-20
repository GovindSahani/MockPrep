const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: false, // optional for Google OAuth users
  },
  googleId: {
    type: String,
    required: false,
    sparse: true,
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  resumeUrl: {
    type: String,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
    required: false,
  },
  otpExpiresAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
