const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { generateOTP, sendOTPEmail } = require('../services/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Hash an OTP for secure storage
const hashOTP = async (otp) => {
  const salt = await bcrypt.genSalt(6);
  return bcrypt.hash(otp, salt);
};

// @route POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local',
      isVerified: false,
      otp: hashedOTP,
      otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    if (user) {
      // Send OTP email
      await sendOTPEmail(email, otp);

      res.status(201).json({
        requiresOTP: true,
        email: user.email,
        message: 'Account created. Verification code sent to your email.',
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // If user signed up with Google and has no password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        message: 'This account uses Google Sign-In. Please use the "Continue with Google" button.',
      });
    }

    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    // Save OTP to user
    user.otp = hashedOTP;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({
      requiresOTP: true,
      email: user.email,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'No OTP requested. Please login again.' });
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpiresAt) {
      user.otp = undefined;
      user.otpExpiresAt = undefined;
      await user.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Compare OTP
    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP is valid — clear OTP fields & mark verified
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.isVerified = true;
    await user.save();

    // Issue JWT
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      resumeUrl: user.resumeUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/resend-otp
const resendOTP = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Rate limit: don't resend if last OTP was sent less than 30 seconds ago
    if (user.otpExpiresAt) {
      const timeSinceGenerated = Date.now() - (user.otpExpiresAt.getTime() - 10 * 60 * 1000);
      if (timeSinceGenerated < 30 * 1000) {
        return res.status(429).json({ message: 'Please wait before requesting a new code.' });
      }
    }

    // Generate new OTP
    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    user.otp = hashedOTP;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, otp);

    res.json({ message: 'New verification code sent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/auth/google
const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required.' });
  }

  try {
    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If existing user signed up locally, link Google account
      if (!user.googleId) {
        user.googleId = googleId;
        if (user.authProvider === 'local') {
          // Keep as local since they already have a password
        } else {
          user.authProvider = 'google';
        }
        user.isVerified = true; // Google accounts are inherently verified
        await user.save();
      }
    } else {
      // Create new user from Google profile
      user = await User.create({
        name: name || 'Google User',
        email,
        googleId,
        authProvider: 'google',
        isVerified: true, // Google accounts are inherently verified
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      resumeUrl: user.resumeUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Google auth error:', error.message);
    res.status(401).json({ message: 'Google authentication failed. Please try again.' });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -otp -otpExpiresAt');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOTP,
  resendOTP,
  googleLogin,
  getMe,
};
