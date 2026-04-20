import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const { user, loading } = useAuth();

  // Redirect authenticated users straight to the dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex-col app-wrapper">
      <Navbar />
      <main className="container flex-center" style={{ flex: 1, flexDirection: 'column', textAlign: 'center' }}>
        <h1 className="page-title landing-hero-title">Master Your Next Interview</h1>
        <p className="landing-subtitle">
          MockPrep acts as your personal AI interviewer. Practice, record, and get instant, actionable feedback to land your dream job.
        </p>
        
        <div className="landing-cta">
          <Link to="/register">
            <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Start Practicing Free
            </button>
          </Link>
          <Link to="/login">
            <button className="btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
              Login
            </button>
          </Link>
        </div>

        <div className="landing-features">
          <FeatureCard
            title="AI Mock Interviews"
            text="Adaptive question generation with real-time follow-ups across text, coding, and bug-fix rounds — tailored to your chosen role and difficulty."
          />
          <FeatureCard
            title="Smart Integrity Monitoring"
            text="Built-in tab-switch detection, paste tracking, and per-question timers ensure genuine practice with a transparent integrity score."
          />
          <FeatureCard
            title="Resume Review & ATS Scoring"
            text="Upload your resume for an instant ATS compatibility score, strengths & weakness analysis, and actionable improvement recommendations."
          />
        </div>
      </main>
    </div>
  );
};

const FeatureCard = ({ title, text }) => (
  <div className="glass-panel feature-card">
    <h3 style={{ color: 'var(--accent-color)', marginBottom: '12px', fontSize: '1.2rem' }}>{title}</h3>
    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{text}</p>
  </div>
);

export default LandingPage;
