import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const ResumeHistoryPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedReview, setExpandedReview] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/resume/history');
        setReviews(res.data);
      } catch (error) {
        console.error('Error fetching resume history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleExpand = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedReview(null);
      return;
    }
    setExpandedId(id);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/resume/${id}`);
      setExpandedReview(res.data);
    } catch (error) {
      console.error('Error fetching review detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return '#22d3ee';
    if (score >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    if (score >= 30) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div className="app-wrapper flex-col">
      <Navbar />
      <div className="container" style={{ flex: 1, padding: '40px 24px' }}>
        <div className="responsive-header">
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Resume History</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Review your past resume analyses and track your improvements.
            </p>
          </div>
          <Link to="/resume-review">
            <button className="btn-primary" style={{ whiteSpace: 'nowrap' }}>📄 New Review</button>
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading review history...</p>
        ) : reviews.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>📄</p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              You haven't reviewed any resumes yet.
            </p>
            <Link to="/resume-review">
              <button className="btn-primary">Upload Your First Resume</button>
            </Link>
          </div>
        ) : (
          <div className="resume-history-list">
            {reviews.map((r) => (
              <div key={r._id} className="glass-panel resume-history-card">
                {/* Summary Row */}
                <div
                  className="resume-history-summary"
                  onClick={() => handleExpand(r._id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="resume-history-file">
                    <span className="resume-history-icon">
                      {r.fileType === 'pdf' ? '📕' : '📘'}
                    </span>
                    <div>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>{r.fileName}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {new Date(r.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="resume-history-score-wrap">
                    <div
                      className="resume-history-score"
                      style={{ color: getScoreColor(r.atsScore) }}
                    >
                      {r.atsScore}
                    </div>
                    <span
                      className="ats-score-badge"
                      style={{
                        backgroundColor: getScoreColor(r.atsScore) + '22',
                        color: getScoreColor(r.atsScore),
                        fontSize: '0.75rem',
                      }}
                    >
                      {getScoreLabel(r.atsScore)}
                    </span>
                  </div>

                  <div className="resume-history-stats">
                    <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>
                      ✓ {r.strengths?.length || 0} strengths
                    </span>
                    <span style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
                      ⚠ {r.weaknesses?.length || 0} weaknesses
                    </span>
                  </div>

                  <span className={`resume-history-chevron ${expandedId === r._id ? 'open' : ''}`}>
                    ▾
                  </span>
                </div>

                {/* Expanded Detail */}
                {expandedId === r._id && (
                  <div className="resume-history-detail">
                    {loadingDetail ? (
                      <p style={{ color: 'var(--text-secondary)', padding: '16px 0' }}>Loading details...</p>
                    ) : expandedReview ? (
                      <>
                        <div className="resume-grid" style={{ marginTop: '16px' }}>
                          <div className="resume-card resume-card--strengths" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '12px', padding: '16px' }}>
                            <h4 style={{ color: 'var(--success)', marginBottom: '12px' }}>✓ Strengths</h4>
                            <ul className="resume-card-list">
                              {expandedReview.strengths.map((s, i) => (
                                <li key={i} className="resume-card-item resume-card-item--success">{s}</li>
                              ))}
                            </ul>
                          </div>
                          <div className="resume-card resume-card--weaknesses" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '12px', padding: '16px' }}>
                            <h4 style={{ color: 'var(--warning)', marginBottom: '12px' }}>⚠ Weaknesses</h4>
                            <ul className="resume-card-list">
                              {expandedReview.weaknesses.map((w, i) => (
                                <li key={i} className="resume-card-item resume-card-item--warning">{w}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {expandedReview.recommendations.length > 0 && (
                          <div style={{ marginTop: '16px', background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '12px', padding: '16px' }}>
                            <h4 style={{ color: 'var(--accent-color)', marginBottom: '12px' }}>💡 Recommendations</h4>
                            <ol className="resume-recommendations-list">
                              {expandedReview.recommendations.map((rec, i) => (
                                <li key={i} className="resume-recommendation-item">
                                  <span className="recommendation-number">{i + 1}</span>
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {expandedReview.detailedFeedback && (
                          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px' }}>
                            <h4 style={{ color: 'var(--primary-color)', marginBottom: '12px' }}>📝 Detailed Analysis</h4>
                            <div className="resume-feedback-text">
                              {expandedReview.detailedFeedback.split('\n').map((para, i) => (
                                <p key={i} style={{ marginBottom: '10px', lineHeight: '1.7' }}>{para}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeHistoryPage;
