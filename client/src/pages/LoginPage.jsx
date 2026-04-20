import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-field validation
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Validate fields whenever values change (only show errors after touch)
  useEffect(() => {
    const errors = { email: '', password: '' };

    if (touched.email) {
      if (!email.trim()) errors.email = 'Email is required.';
      else if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address.';
    }

    if (touched.password) {
      if (!password) errors.password = 'Password is required.';
      else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
  }, [email, password, touched]);

  const isFormValid = EMAIL_REGEX.test(email) && password.length >= 6;

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Initialize Google Sign-In button
  useEffect(() => {
    if (!window.google || !GOOGLE_CLIENT_ID) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'filled_black',
      size: 'large',
      width: '100%',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }, []);

  const handleGoogleResponse = async (response) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await googleLogin(response.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched to surface any remaining errors
    setTouched({ email: true, password: true });
    if (!isFormValid) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const data = await login(email, password);
      if (data.requiresOTP) {
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Return the inline border style for a field */
  const fieldStyle = (field) => {
    if (!touched[field]) return {};
    return fieldErrors[field]
      ? { borderColor: 'var(--danger)' }
      : { borderColor: 'var(--success)' };
  };

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container flex-center" style={{ flex: 1 }}>
        <form onSubmit={handleSubmit} className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '0 16px' }} noValidate>
          <h2 className="page-title" style={{ fontSize: '2rem', textAlign: 'center' }}>Welcome Back</h2>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
          
          {/* Google Sign-In Button */}
          <div className="google-btn-wrapper">
            <div ref={googleBtnRef} className="google-btn-container"></div>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line"></span>
            <span className="auth-divider-text">or sign in with email</span>
            <span className="auth-divider-line"></span>
          </div>

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              style={fieldStyle('email')}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
            />
            {touched.email && fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>
          
          {/* Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              style={fieldStyle('password')}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
