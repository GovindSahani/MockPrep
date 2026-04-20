import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import Navbar from '../components/Navbar';

const DashboardPage = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/sessions');
        setSessions(res.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // ── Compute analytics from sessions ──
  const completed = sessions.filter(s => s.status === 'completed');
  const totalSessions = sessions.length;
  const totalCompleted = completed.length;
  const completionRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0;

  const avgIntegrity = totalCompleted > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.integrityScore ?? 100), 0) / totalCompleted)
    : 0;

  const difficultyMap = { Easy: 0, Medium: 0, Hard: 0 };
  completed.forEach(s => { if (difficultyMap[s.difficulty] !== undefined) difficultyMap[s.difficulty]++; });
  const diffTotal = difficultyMap.Easy + difficultyMap.Medium + difficultyMap.Hard;

  const roleMap = {};
  completed.forEach(s => { roleMap[s.role] = (roleMap[s.role] || 0) + 1; });
  const topRole = Object.entries(roleMap).sort((a, b) => b[1] - a[1])[0];

  const integrityColor = avgIntegrity >= 80 ? 'var(--success)' : avgIntegrity >= 50 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container" style={{ flex: 1, padding: '40px 24px' }}>
        <div className="responsive-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Welcome back! Ready for your next mock interview?</p>
          </div>
          <Link to="/setup">
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
              <span>+ Start New Interview</span>
            </button>
          </Link>
        </div>

        {/* Quick Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '20px', marginBottom: '40px' }}>
          <Link to="/setup" style={{ textDecoration: 'none' }}>
            <div className="glass-panel dashboard-action-card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'all 0.3s', borderColor: 'rgba(59,130,246,0.3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎤</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Mock Interview</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Practice with AI-powered mock interviews</p>
            </div>
          </Link>
          <Link to="/resume-review" style={{ textDecoration: 'none' }}>
            <div className="glass-panel dashboard-action-card" style={{ textAlign: 'center', padding: '32px 24px', cursor: 'pointer', transition: 'all 0.3s', borderColor: 'rgba(139,92,246,0.3)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📄</div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>Resume Review</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Get ATS score & AI-powered feedback</p>
            </div>
          </Link>
        </div>

        {/* ── Analytics Panel ── */}
        {!loading && totalCompleted > 0 && (
          <div className="glass-panel analytics-panel" style={{ marginBottom: '40px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', color: 'var(--text-primary)' }}>📊 Your Progress</h3>

            <div className="analytics-grid">
              {/* Stat: Completed */}
              <div className="analytics-stat">
                <span className="analytics-stat-value">{totalCompleted}</span>
                <span className="analytics-stat-label">Completed</span>
              </div>

              {/* Stat: Completion Rate */}
              <div className="analytics-stat">
                <span className="analytics-stat-value" style={{ color: completionRate >= 80 ? 'var(--success)' : 'var(--warning)' }}>
                  {completionRate}%
                </span>
                <span className="analytics-stat-label">Completion Rate</span>
              </div>

              {/* Stat: Avg Integrity — mini gauge */}
              <div className="analytics-stat">
                <div className="analytics-mini-gauge">
                  <svg viewBox="0 0 80 80" className="analytics-gauge-svg">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                    <circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke={integrityColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - avgIntegrity / 100)}`}
                      style={{ transition: 'stroke-dashoffset 1s ease', transform: 'rotate(-90deg)', transformOrigin: 'center', filter: `drop-shadow(0 0 4px ${integrityColor})` }}
                    />
                  </svg>
                  <span className="analytics-gauge-value" style={{ color: integrityColor }}>{avgIntegrity}</span>
                </div>
                <span className="analytics-stat-label">Avg Integrity</span>
              </div>

              {/* Stat: Top Role */}
              <div className="analytics-stat">
                <span className="analytics-stat-value analytics-stat-role">
                  {topRole ? topRole[0] : '—'}
                </span>
                <span className="analytics-stat-label">
                  {topRole ? `${topRole[1]} session${topRole[1] > 1 ? 's' : ''}` : 'Top Role'}
                </span>
              </div>
            </div>

            {/* Difficulty Breakdown Bar */}
            {diffTotal > 0 && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <span>Difficulty Breakdown</span>
                  <span>{diffTotal} interview{diffTotal > 1 ? 's' : ''}</span>
                </div>
                <div className="analytics-diff-bar">
                  {difficultyMap.Easy > 0 && (
                    <div
                      className="analytics-diff-segment analytics-diff-easy"
                      style={{ width: `${(difficultyMap.Easy / diffTotal) * 100}%` }}
                      title={`Easy: ${difficultyMap.Easy}`}
                    />
                  )}
                  {difficultyMap.Medium > 0 && (
                    <div
                      className="analytics-diff-segment analytics-diff-medium"
                      style={{ width: `${(difficultyMap.Medium / diffTotal) * 100}%` }}
                      title={`Medium: ${difficultyMap.Medium}`}
                    />
                  )}
                  {difficultyMap.Hard > 0 && (
                    <div
                      className="analytics-diff-segment analytics-diff-hard"
                      style={{ width: `${(difficultyMap.Hard / diffTotal) * 100}%` }}
                      title={`Hard: ${difficultyMap.Hard}`}
                    />
                  )}
                </div>
                <div className="analytics-diff-legend">
                  {difficultyMap.Easy > 0 && <span><i style={{ background: 'var(--success)' }} /> Easy ({difficultyMap.Easy})</span>}
                  {difficultyMap.Medium > 0 && <span><i style={{ background: 'var(--warning)' }} /> Medium ({difficultyMap.Medium})</span>}
                  {difficultyMap.Hard > 0 && <span><i style={{ background: 'var(--danger)' }} /> Hard ({difficultyMap.Hard})</span>}
                </div>
              </div>
            )}
          </div>
        )}

        <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', color: 'var(--text-primary)' }}>Your Recent Sessions</h3>
        
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>You haven't completed any mock interviews yet.</p>
            <Link to="/setup">
              <button className="btn-outline">Start your first interview</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: '24px' }}>
            {sessions.map(session => (
              <div key={session._id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{session.role} ({session.difficulty})</span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    padding: '4px 8px', 
                    borderRadius: '12px',
                    backgroundColor: session.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: session.status === 'completed' ? 'var(--success)' : 'var(--warning)'
                  }}>
                    {session.status}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                  {new Date(session.startedAt).toLocaleDateString()}
                </p>
                
                {session.status === 'completed' ? (
                  <Link to={`/results/${session._id}`} style={{ marginTop: 'auto' }}>
                    <button className="btn-outline" style={{ width: '100%' }}>View Results</button>
                  </Link>
                ) : (
                  <Link to={`/interview/${session._id}`} style={{ marginTop: 'auto' }}>
                    <button className="btn-primary" style={{ width: '100%', background: 'var(--warning)' }}>Resume Interview</button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
