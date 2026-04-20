import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { formatScore } from '../utils/helpers';

const ResultsPage = () => {
  const { id } = useParams();
  const [results, setResults] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resResults, resSession] = await Promise.all([
          api.get(`/results/session/${id}`),
          api.get(`/sessions/${id}`),
        ]);
        setResults(resResults.data);
        setSession(resSession.data);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="container flex-center" style={{ minHeight: '100vh' }}><h1>Loading Analysis...</h1></div>;

  const integrityScore = session?.integrityScore ?? 100;
  const integrityColor = integrityScore >= 80 ? 'var(--success)' : integrityScore >= 50 ? 'var(--warning)' : 'var(--danger)';
  const integrityLabel = integrityScore >= 80 ? 'Excellent' : integrityScore >= 50 ? 'Moderate' : 'Low';
  const flagged = session?.flagged || false;
  const fastAnswers = (session?.timeLog || []).filter(t => t.timeTakenSeconds < 20).length;

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container" style={{ flex: 1, padding: '40px 24px' }}>
        <div className="responsive-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Interview Results</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Review your AI-generated feedback and scores.</p>
          </div>
          <Link to="/dashboard">
            <button className="btn-outline">Back to Dashboard</button>
          </Link>
        </div>

        {/* ── Flagged banner ── */}
        {flagged && (
          <div className="glass-panel" style={{
            borderLeft: '4px solid var(--danger)',
            background: 'rgba(239, 68, 68, 0.08)',
            marginBottom: '24px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <span style={{ fontSize: '1.5rem' }}>🚩</span>
            <div>
              <p style={{ fontWeight: 600, color: 'var(--danger)' }}>Session Flagged</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {session?.flagReason || 'Session flagged due to suspicious activity.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Integrity Score Card ── */}
        {session && (
          <div className="glass-panel" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
              {/* Circular gauge */}
              <div className="integrity-gauge">
                <svg className="integrity-gauge-svg" viewBox="0 0 120 120">
                  <circle className="integrity-gauge-track" cx="60" cy="60" r="52" />
                  <circle
                    className="integrity-gauge-fill"
                    cx="60" cy="60" r="52"
                    style={{
                      '--integrity-color': integrityColor,
                      '--integrity-score': integrityScore,
                    }}
                  />
                </svg>
                <div className="integrity-gauge-label">
                  <span className="integrity-gauge-number" style={{ color: integrityColor }}>{integrityScore}</span>
                  <span className="integrity-gauge-text">INTEGRITY</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3 style={{ marginBottom: '8px' }}>Session Integrity</h3>
                <span style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: '20px',
                  fontWeight: 600, fontSize: '0.85rem',
                  background: `${integrityColor}22`, color: integrityColor,
                }}>
                  {integrityLabel}
                </span>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  This score reflects how independently you completed the interview, based on tab focus, paste activity, and answer timing.
                </p>

                {/* Toggle breakdown */}
                <button
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--primary-color)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500,
                    marginTop: '8px', padding: 0,
                  }}
                >
                  {showBreakdown ? '▲ Hide Breakdown' : '▼ Show Breakdown'}
                </button>

                {showBreakdown && (
                  <div className="integrity-breakdown">
                    <div className="integrity-breakdown-item">
                      <span>🔀 Tab switches</span>
                      <span style={{ color: (session.tabSwitchCount || 0) > 3 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {session.tabSwitchCount || 0}
                      </span>
                    </div>
                    <div className="integrity-breakdown-item">
                      <span>📋 Paste events</span>
                      <span style={{ color: (session.pasteLog?.length || 0) > 2 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {session.pasteLog?.length || 0}
                      </span>
                    </div>
                    <div className="integrity-breakdown-item">
                      <span>⚡ Fast answers flagged</span>
                      <span style={{ color: fastAnswers > 1 ? 'var(--danger)' : 'var(--text-primary)' }}>
                        {fastAnswers}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Question Results ── */}
        {results.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <p>No results found for this session.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {results.map((r, index) => (
              <div key={r._id} className="glass-panel">
                <h3 style={{ fontSize: '1.3rem', color: 'var(--accent-color)', marginBottom: '16px' }}>
                  Q{index + 1}: {r.questionText}
                </h3>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
                  <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Your Answer:</span>
                  <p style={{ color: 'var(--text-secondary)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>"{r.answerText}"</p>
                </div>

                {/* Follow-up Q&A if present */}
                {r.followUpQuestion && (
                  <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '16px', borderRadius: '8px', marginBottom: '24px', borderLeft: '3px solid var(--accent-color)' }}>
                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', color: 'var(--accent-color)', fontSize: '0.9rem' }}>⚡ Follow-Up Question:</span>
                    <p style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>{r.followUpQuestion}</p>
                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '6px', fontSize: '0.9rem' }}>Your Follow-Up Answer:</span>
                    <p style={{ color: 'var(--text-secondary)', wordBreak: 'break-word' }}>"{r.followUpAnswer || 'No follow-up answer provided.'}"</p>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <ScoreBox label="Overall" score={r.scores?.overall} isMain />
                  <ScoreBox label="Technical" score={r.scores?.technical} />
                  <ScoreBox label="Communication" score={r.scores?.communication} />
                  <ScoreBox label="Depth" score={r.scores?.depth} />
                </div>

                <div>
                  <h4 style={{ color: 'var(--primary-color)', marginBottom: '8px' }}>AI Feedback</h4>
                  <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{r.aiFeedback || 'No feedback provided yet.'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ScoreBox = ({ label, score, isMain }) => {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)';
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      padding: '16px', 
      borderRadius: '8px',
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: isMain ? '2rem' : '1.5rem', fontWeight: 'bold', color }}>{formatScore(score)}</span>
    </div>
  );
};

export default ResultsPage;
