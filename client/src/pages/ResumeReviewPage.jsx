import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/Navbar';

const ResumeReviewPage = () => {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const validateFile = (f) => {
    if (!allowedTypes.includes(f.type)) {
      setError('Only PDF and DOCX files are supported.');
      return false;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return false;
    }
    setError('');
    return true;
  };

  const handleFile = (f) => {
    if (validateFile(f)) {
      setFile(f);
      setReview(null);
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/resume/review', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded * 100) / e.total);
          setProgress(pct);
        },
      });
      setReview(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setReview(null);
    setError('');
    setProgress(0);
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
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Resume Review</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Upload your resume to get AI-powered feedback, ATS score, and improvement tips.
            </p>
          </div>
          <Link to="/resume-history">
            <button className="btn-outline" style={{ whiteSpace: 'nowrap' }}>📋 View History</button>
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="glass-panel resume-error" style={{ marginBottom: '24px', borderColor: 'var(--danger)' }}>
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>⚠ {error}</span>
          </div>
        )}

        {/* UPLOAD STATE */}
        {!review && (
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Drop Zone */}
            <div
              className={`resume-dropzone ${dragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => !file && inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleChange}
                style={{ display: 'none' }}
              />
              {!file ? (
                <>
                  <div className="dropzone-icon">📄</div>
                  <p className="dropzone-title">Drag & drop your resume here</p>
                  <p className="dropzone-subtitle">or click to browse files</p>
                  <p className="dropzone-hint">PDF or DOCX • Max 5 MB</p>
                </>
              ) : (
                <div className="dropzone-selected">
                  <div className="dropzone-file-icon">
                    {file.name.endsWith('.pdf') ? '📕' : '📘'}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>{file.name}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    className="dropzone-remove"
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="resume-progress-wrap">
                <div className="resume-progress-bar">
                  <div
                    className="resume-progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {progress < 100 ? `Uploading... ${progress}%` : 'Analyzing your resume with AI...'}
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              className="btn-primary"
              style={{ width: '100%', marginTop: '24px', fontSize: '1.1rem', padding: '16px' }}
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? '⏳ Analyzing...' : '🚀 Analyze Resume'}
            </button>
          </div>
        )}

        {/* RESULTS STATE */}
        {review && (
          <div className="resume-results">
            {/* ATS Score Gauge */}
            <div className="resume-score-section glass-panel">
              <div
                className="ats-gauge"
                style={{
                  '--score': review.atsScore,
                  '--score-color': getScoreColor(review.atsScore),
                }}
              >
                <svg viewBox="0 0 120 120" className="ats-gauge-svg">
                  <circle className="ats-gauge-track" cx="60" cy="60" r="52" />
                  <circle className="ats-gauge-fill" cx="60" cy="60" r="52" />
                </svg>
                <div className="ats-gauge-label">
                  <span className="ats-gauge-number">{review.atsScore}</span>
                  <span className="ats-gauge-text">ATS Score</span>
                </div>
              </div>
              <div className="ats-score-meta">
                <span
                  className="ats-score-badge"
                  style={{ backgroundColor: getScoreColor(review.atsScore) + '22', color: getScoreColor(review.atsScore) }}
                >
                  {getScoreLabel(review.atsScore)}
                </span>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                  Based on keyword optimization, formatting, and content quality.
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Grid */}
            <div className="resume-grid">
              {/* Strengths */}
              <div className="glass-panel resume-card resume-card--strengths">
                <h3 className="resume-card-title">
                  <span className="resume-card-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--success)' }}>✓</span>
                  Strengths
                </h3>
                <ul className="resume-card-list">
                  {review.strengths.map((item, i) => (
                    <li key={i} className="resume-card-item resume-card-item--success">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="glass-panel resume-card resume-card--weaknesses">
                <h3 className="resume-card-title">
                  <span className="resume-card-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>⚠</span>
                  Weaknesses
                </h3>
                <ul className="resume-card-list">
                  {review.weaknesses.map((item, i) => (
                    <li key={i} className="resume-card-item resume-card-item--warning">{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="glass-panel resume-card resume-card--recommendations">
              <h3 className="resume-card-title">
                <span className="resume-card-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-color)' }}>💡</span>
                Recommendations
              </h3>
              <ol className="resume-recommendations-list">
                {review.recommendations.map((item, i) => (
                  <li key={i} className="resume-recommendation-item">
                    <span className="recommendation-number">{i + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Detailed Feedback */}
            <div className="glass-panel resume-card resume-card--feedback">
              <h3 className="resume-card-title">
                <span className="resume-card-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--primary-color)' }}>📝</span>
                Detailed Analysis
              </h3>
              <div className="resume-feedback-text">
                {review.detailedFeedback.split('\n').map((para, i) => (
                  <p key={i} style={{ marginBottom: '12px', lineHeight: '1.7' }}>{para}</p>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={handleReset} style={{ flex: '1 1 200px' }}>
                📄 Upload Another Resume
              </button>
              <Link to="/resume-history" style={{ flex: '1 1 200px' }}>
                <button className="btn-outline" style={{ width: '100%' }}>📋 View All Reviews</button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeReviewPage;
