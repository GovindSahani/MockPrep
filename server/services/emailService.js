const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with styled HTML
const sendOTPEmail = async (email, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"MockPrep" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your MockPrep Verification Code',
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #818cf8; margin: 0; font-size: 28px;">MockPrep</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">AI-Powered Mock Interview Platform</p>
        </div>
        
        <div style="background: #1e293b; border-radius: 12px; padding: 24px; text-align: center;">
          <p style="color: #cbd5e1; font-size: 15px; margin: 0 0 16px;">Your verification code is:</p>
          
          <div style="background: #0f172a; border: 2px solid #818cf8; border-radius: 10px; padding: 16px 24px; display: inline-block; margin-bottom: 16px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #818cf8;">${otp}</span>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px; margin: 0;">
            This code expires in <strong style="color: #f59e0b;">10 minutes</strong>.
          </p>
        </div>
        
        <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Failed to send OTP email:', error.message);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = { generateOTP, sendOTPEmail };
