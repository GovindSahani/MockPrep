import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const OTPVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const { verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  // Redirect if no email in state (direct URL access)
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const maskEmail = (email) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) return `${local}@${domain}`;
    return `${local[0]}${'•'.repeat(local.length - 2)}${local[local.length - 1]}@${domain}`;
  };

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await verifyOTP(email, otpString);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setError(null);
    setSuccess(null);
    try {
      await resendOTP(email);
      setSuccess('New verification code sent!');
      setCountdown(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    }
  };

  if (!email) return null;

  const isOtpComplete = otp.every((d) => d !== '');

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container flex-center" style={{ flex: 1 }}>
        <form onSubmit={handleSubmit} className="glass-panel otp-panel" noValidate>
          
          {/* Icon */}
          <div className="otp-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>

          <h2 className="page-title" style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '8px' }}>
            Verify Your Email
          </h2>
          
          <p className="otp-subtitle">
            We've sent a 6-digit code to<br />
            <strong style={{ color: 'var(--primary)' }}>{maskEmail(email)}</strong>
          </p>

          {error && <div className="otp-message otp-error">{error}</div>}
          {success && <div className="otp-message otp-success">{success}</div>}

          {/* OTP Input Boxes */}
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                className={`otp-input ${digit ? 'otp-input-filled' : ''}`}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                autoComplete="one-time-code"
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', marginTop: '24px' }}
            disabled={isSubmitting || !isOtpComplete}
          >
            {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
          </button>

          {/* Resend section */}
          <div className="otp-resend-section">
            {canResend ? (
              <button type="button" className="otp-resend-btn" onClick={handleResend}>
                Resend Code
              </button>
            ) : (
              <p className="otp-timer">
                Resend code in <span className="otp-timer-count">{countdown}s</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerificationPage;
