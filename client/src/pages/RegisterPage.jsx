import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: 'var(--danger)', pct: 20 };
  if (score <= 2) return { label: 'Fair', color: 'var(--warning)', pct: 40 };
  if (score <= 3) return { label: 'Good', color: '#22d3ee', pct: 65 };
  return { label: 'Strong', color: 'var(--success)', pct: 100 };
};

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Per-field validation
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '' });
  
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  // Validate fields whenever values change (only show errors after touch)
  useEffect(() => {
    const errors = { name: '', email: '', password: '' };

    if (touched.name) {
      if (!name.trim()) errors.name = 'Full name is required.';
      else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters.';
    }

    if (touched.email) {
      if (!email.trim()) errors.email = 'Email is required.';
      else if (!EMAIL_REGEX.test(email)) errors.email = 'Enter a valid email address.';
    }

    if (touched.password) {
      if (!password) errors.password = 'Password is required.';
      else if (password.length < 6) errors.password = 'Password must be at least 6 characters.';
      else if (!/[A-Z]/.test(password)) errors.password = 'Include at least one uppercase letter.';
      else if (!/[0-9]/.test(password)) errors.password = 'Include at least one number.';
    }

    setFieldErrors(errors);
  }, [name, email, password, touched]);

  const isFormValid =
    name.trim().length >= 2 &&
    EMAIL_REGEX.test(email) &&
    password.length >= 6 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const pwStrength = password.length > 0 ? getPasswordStrength(password) : null;

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
      text: 'signup_with',
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
      setError(err.response?.data?.message || 'Google sign-up failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched to surface any remaining errors
    setTouched({ name: true, email: true, password: true });
    if (!isFormValid) return;

    setError(null);
    setIsSubmitting(true);
    try {
      const data = await register(name, email, password);
      if (data.requiresOTP) {
        navigate('/verify-otp', { state: { email: data.email } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
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
          <h2 className="page-title" style={{ fontSize: '2rem', textAlign: 'center' }}>Create Account</h2>
          
          {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
          
          {/* Google Sign-Up Button */}
          <div className="google-btn-wrapper">
            <div ref={googleBtnRef} className="google-btn-container"></div>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span className="auth-divider-line"></span>
            <span className="auth-divider-text">or sign up with email</span>
            <span className="auth-divider-line"></span>
          </div>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              style={fieldStyle('name')}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
            />
            {touched.name && fieldErrors.name && (
              <span className="field-error">{fieldErrors.name}</span>
            )}
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

            {/* Password strength bar */}
            {pwStrength && (
              <div className="pw-strength-wrap">
                <div className="pw-strength-track">
                  <div
                    className="pw-strength-fill"
                    style={{ width: `${pwStrength.pct}%`, background: pwStrength.color }}
                  />
                </div>
                <span className="pw-strength-label" style={{ color: pwStrength.color }}>
                  {pwStrength.label}
                </span>
              </div>
            )}
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
          
          <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
