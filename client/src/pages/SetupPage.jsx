import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import Navbar from '../components/Navbar';
import api from '../services/api';

const SetupPage = () => {
  const [role, setRole] = useState('frontend');
  const [difficulty, setDifficulty] = useState('Medium');
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [checking, setChecking] = useState(true);
  
  const { startSession, loading } = useInterview();
  const navigate = useNavigate();

  useEffect(() => {
    const checkActiveSession = async () => {
      try {
        const res = await api.get('/sessions');
        const active = res.data.find(s => s.status === 'active');
        if (active) {
          setActiveSession(active);
        }
      } catch (err) {
        console.error('Failed to check sessions', err);
      } finally {
        setChecking(false);
      }
    };
    checkActiveSession();
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    if (activeSession) return;
    setError(null);
    try {
      const newSession = await startSession(role, difficulty);
      navigate(`/interview/${newSession._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start session');
    }
  };

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container flex-center" style={{ flex: 1 }}>
        <form onSubmit={handleStart} className="glass-panel" style={{ width: '100%', maxWidth: '500px', margin: '0 16px' }}>
          <h2 className="page-title" style={{ fontSize: '2rem', textAlign: 'center' }}>Setup Interview</h2>
          
          {checking ? (
            <div style={{ textAlign: 'center', margin: '40px 0', color: 'var(--text-secondary)' }}>Checking for active sessions...</div>
          ) : activeSession ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ color: 'var(--warning)', marginBottom: '16px', fontSize: '1.1rem' }}>
                ⚠️ You already have an active interview session ({activeSession.role} - {activeSession.difficulty}).
              </div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Please complete your ongoing interview before starting a new one.</p>
              <Link to={`/interview/${activeSession._id}`}>
                <button className="btn-primary" type="button" style={{ width: '100%', fontSize: '1.1rem' }}>
                  Resume Interview
                </button>
              </Link>
            </div>
          ) : (
            <>
              {error && <div style={{ color: 'var(--danger)', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
              
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Target Role</label>
                <select 
                  className="input-field" 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="frontend">Frontend Developer</option>
                  <option value="backend">Backend Developer</option>
                  <option value="fullstack">Fullstack Developer</option>
                  <option value="dsa">Data Structures & Algorithms</option>
                  <option value="hr">HR / Behavioral</option>
                </select>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Difficulty Level</label>
                <select 
                  className="input-field" 
                  value={difficulty} 
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              
              <button type="submit" className="btn-primary" style={{ width: '100%', fontSize: '1.1rem' }} disabled={loading}>
                {loading ? 'Initializing AI Engine...' : 'Begin Mock Interview'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default SetupPage;
