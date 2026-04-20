import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInterview } from '../context/InterviewContext';
import { useTimer } from '../hooks/useTimer';
import Navbar from '../components/Navbar';
import api from '../services/api';

const InterviewPage = () => {
  const { id } = useParams();
  const { currentSession, questions, currentQuestionIndex, submitAnswer, completeSession, loading, loadSession } = useInterview();

  const [liveAnswer, setLiveAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  // ── Integrity state ──
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const tabSwitchLogRef = useRef([]);
  const pasteLogRef = useRef([]);
  const timeLogRef = useRef([]);
  const questionStartTimeRef = useRef(Date.now());

  // ── Toast state ──
  const [toasts, setToasts] = useState([]);

  // ── Follow-up state ──
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  // Refs for latest values in callbacks
  const liveAnswerRef = useRef('');
  const secondsLeftRef = useRef(120);
  const tabSwitchCountRef = useRef(0);
  const handleNextRef = useRef(null);

  useEffect(() => { liveAnswerRef.current = liveAnswer; }, [liveAnswer]);
  useEffect(() => { tabSwitchCountRef.current = tabSwitchCount; }, [tabSwitchCount]);

  // ── Toast helper ──
  const showToast = useCallback((message, type = 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  // ── Timer ──
  const onTimerExpire = useCallback(() => {
    if (handleNextRef.current) handleNextRef.current();
  }, []);

  const { secondsLeft, start, pause, reset } = useTimer(120, onTimerExpire);
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);

  // ── Follow-up timer ──
  const onFollowUpExpire = useCallback(() => {
    // Auto-submit follow-up with whatever they have
    if (pendingSubmission) {
      finalizeSubmission(pendingSubmission.answerText, pendingSubmission.timeTaken, followUpQuestion, followUpAnswer || 'No follow-up answer provided.');
    }
  }, [pendingSubmission, followUpQuestion, followUpAnswer]);

  const { secondsLeft: followUpSecondsLeft, start: startFollowUpTimer, reset: resetFollowUpTimer } = useTimer(60, onFollowUpExpire);

  // ── Load session if needed ──
  useEffect(() => {
    if (!currentSession && id && loadSession) {
      loadSession(id).catch(err => {
        console.error("Failed to load session:", err);
        navigate('/dashboard');
      });
    } else if (!currentSession && !loading && !id) {
      navigate('/dashboard');
    }
  }, [id, currentSession, loadSession, navigate, loading]);

  // Determine what to show
  const isReady = currentSession && questions.length > 0 && !loading;
  const currentQuestion = isReady ? questions[currentQuestionIndex] : null;
  const questionType = currentQuestion?.type || 'text';
  const questionLanguage = currentQuestion?.language || 'none';

  // ═══════════════════════════════════════
  //  TAB SWITCH / FOCUS DETECTION
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isReady) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordTabSwitch();
      }
    };

    const handleBlur = () => {
      recordTabSwitch();
    };

    // Debounce to avoid double-counting from both events
    let lastSwitchTime = 0;
    function recordTabSwitch() {
      const now = Date.now();
      if (now - lastSwitchTime < 1000) return; // Debounce 1s
      lastSwitchTime = now;

      const newCount = tabSwitchCountRef.current + 1;
      setTabSwitchCount(newCount);
      tabSwitchCountRef.current = newCount;

      tabSwitchLogRef.current.push({
        timestamp: new Date().toISOString(),
        switchNumber: newCount,
      });

      if (newCount === 1) {
        showToast('⚠️ We noticed you left the interview tab. This will be recorded.', 'warning');
      } else if (newCount === 3) {
        showToast('🚨 Multiple tab switches detected. Your session may be flagged.', 'danger');
      } else if (newCount >= 5) {
        showToast('🚫 Session flagged due to suspicious activity. Auto-submitting...', 'danger');
        // Auto-submit after a brief delay so the toast is visible
        setTimeout(() => {
          autoSubmitSession();
        }, 1500);
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isReady, showToast]);

  // ═══════════════════════════════════════
  //  COPY-PASTE DETECTION
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isReady) return;

    const handlePaste = (e) => {
      const pastedText = e.clipboardData?.getData('text') || '';
      const pastedLength = pastedText.length;

      if (pastedLength > 150) {
        e.preventDefault();
        showToast('⚠️ Pasting large content is not allowed during the interview.', 'warning');
        return;
      }

      // Allow but log silently
      if (pastedLength > 0) {
        pasteLogRef.current.push({
          timestamp: new Date().toISOString(),
          questionIndex: currentQuestionIndex,
          pastedLength,
        });
      }
    };

    const handleContextMenu = (e) => {
      const target = e.target;
      if (target && (target.id === 'code-editor-textarea' || target.closest('.code-editor-wrapper'))) {
        e.preventDefault();
      }
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isReady, currentQuestionIndex, showToast]);

  // ═══════════════════════════════════════
  //  QUESTION CHANGE — reset state + start timer + record start time
  // ═══════════════════════════════════════
  useEffect(() => {
    if (!isReady) return;

    if (questionType === 'bugfix' && currentQuestion?.starterCode) {
      setLiveAnswer(currentQuestion.starterCode);
    } else {
      setLiveAnswer('');
    }

    // Record question start time for time logging
    questionStartTimeRef.current = Date.now();

    reset(120);
    const tid = setTimeout(() => start(), 50);
    return () => clearTimeout(tid);
  }, [currentQuestionIndex, isReady]);

  // ═══════════════════════════════════════
  //  AUTO-SUBMIT SESSION (on 5+ tab switches)
  // ═══════════════════════════════════════
  const autoSubmitSession = useCallback(async () => {
    pause();
    try {
      // Submit current answer
      const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
      timeLogRef.current.push({ questionIndex: currentQuestionIndex, timeTakenSeconds: timeTaken });

      await submitAnswer(liveAnswerRef.current || 'No answer provided.', timeTaken);

      await completeSession({
        tabSwitchCount: tabSwitchCountRef.current,
        tabSwitchLog: tabSwitchLogRef.current,
        pasteLog: pasteLogRef.current,
        timeLog: timeLogRef.current,
      });

      navigate(`/results/${currentSession._id}`);
    } catch (err) {
      console.error('Error auto-submitting:', err);
    }
  }, [currentQuestionIndex, submitAnswer, completeSession, currentSession, navigate, pause]);

  // ═══════════════════════════════════════
  //  FINALIZE SUBMISSION (after follow-up or direct)
  // ═══════════════════════════════════════
  const finalizeSubmission = useCallback(async (answerText, timeTaken, fuQuestion, fuAnswer) => {
    setShowFollowUp(false);
    setFollowUpQuestion('');
    setFollowUpAnswer('');
    resetFollowUpTimer(60);
    setSubmitting(true);

    try {
      await submitAnswer(
        answerText,
        timeTaken,
        fuQuestion || null,
        fuAnswer || null,
        {
          tabSwitchCount: tabSwitchCountRef.current,
          tabSwitchLog: tabSwitchLogRef.current,
          pasteLog: pasteLogRef.current,
          timeLog: timeLogRef.current,
          integrityScore: null, // Will be calculated on session complete
        }
      );

      if (currentQuestionIndex >= questions.length - 1) {
        await completeSession({
          tabSwitchCount: tabSwitchCountRef.current,
          tabSwitchLog: tabSwitchLogRef.current,
          pasteLog: pasteLogRef.current,
          timeLog: timeLogRef.current,
        });
        navigate(`/results/${currentSession._id}`);
      }
      // Otherwise, InterviewContext increments index and useEffect resets timer
    } catch (err) {
      console.error('Error submitting:', err);
    } finally {
      setSubmitting(false);
      setPendingSubmission(null);
    }
  }, [submitAnswer, completeSession, currentSession, currentQuestionIndex, questions.length, navigate, resetFollowUpTimer]);

  // ═══════════════════════════════════════
  //  HANDLE NEXT (with follow-up logic)
  // ═══════════════════════════════════════
  const handleNext = useCallback(async () => {
    if (submitting || showFollowUp) return;
    pause();
    setSubmitting(true);

    const timeTaken = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    timeLogRef.current.push({ questionIndex: currentQuestionIndex, timeTakenSeconds: timeTaken });

    const answerText = liveAnswerRef.current || 'No answer provided.';

    // Trigger follow-up for text and coding types (skip bugfix and first question which is often introductory)
    const shouldFollowUp = (questionType === 'text' || questionType === 'coding') 
      && currentQuestionIndex > 0 
      && answerText !== 'No answer provided.'
      && currentQuestionIndex < questions.length - 1; // Don't delay the last question

    if (shouldFollowUp) {
      setFollowUpLoading(true);
      setSubmitting(false);
      try {
        const res = await api.post('/results/follow-up', {
          questionText: currentQuestion.text,
          answerText,
        });
        setFollowUpQuestion(res.data.followUpQuestion);
        setPendingSubmission({ answerText, timeTaken });
        setShowFollowUp(true);
        resetFollowUpTimer(60);
        setTimeout(() => startFollowUpTimer(), 50);
      } catch (err) {
        console.error('Error getting follow-up:', err);
        // If follow-up fails, just submit normally
        await finalizeSubmission(answerText, timeTaken, null, null);
      } finally {
        setFollowUpLoading(false);
      }
    } else {
      // No follow-up — submit directly
      await finalizeSubmission(answerText, timeTaken, null, null);
    }
  }, [submitting, showFollowUp, pause, currentQuestionIndex, questionType, currentQuestion, questions.length, finalizeSubmission, resetFollowUpTimer, startFollowUpTimer]);

  // Keep handleNextRef up-to-date
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  // ── Submit follow-up answer ──
  const handleFollowUpSubmit = useCallback(() => {
    if (!pendingSubmission) return;
    finalizeSubmission(
      pendingSubmission.answerText,
      pendingSubmission.timeTaken,
      followUpQuestion,
      followUpAnswer || 'No follow-up answer provided.'
    );
  }, [pendingSubmission, followUpQuestion, followUpAnswer, finalizeSubmission]);

  // ═══════════════════════════════════════
  //  INLINE COMPONENTS
  // ═══════════════════════════════════════

  const LanguageBadge = ({ lang }) => {
    if (!lang || lang === 'none') return null;
    const colors = {
      javascript: { bg: 'rgba(247, 223, 30, 0.15)', text: '#f7df1e', label: 'JavaScript' },
      python: { bg: 'rgba(53, 114, 165, 0.2)', text: '#3572A5', label: 'Python' },
    };
    const c = colors[lang] || { bg: 'rgba(255,255,255,0.1)', text: 'var(--text-secondary)', label: lang };
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 12px', borderRadius: '6px',
        background: c.bg, color: c.text,
        fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px',
        textTransform: 'uppercase', marginBottom: '12px'
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.text }} />
        {c.label}
      </span>
    );
  };

  const ProgressDots = () => (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '24px' }}>
      {questions.map((_, i) => (
        <div key={i} style={{
          width: i === currentQuestionIndex ? '32px' : '10px',
          height: '10px',
          borderRadius: '5px',
          background: i < currentQuestionIndex
            ? 'var(--success)'
            : i === currentQuestionIndex
              ? 'linear-gradient(135deg, var(--primary-color), var(--accent-color))'
              : 'rgba(255,255,255,0.15)',
          transition: 'all 0.3s ease',
        }} />
      ))}
    </div>
  );

  const TypeBadge = ({ type }) => {
    const config = {
      text: { icon: '💬', label: 'Text Answer', bg: 'rgba(59,130,246,0.12)' },
      coding: { icon: '💻', label: 'Coding Challenge', bg: 'rgba(16,185,129,0.12)' },
      bugfix: { icon: '🐛', label: 'Bug Fix', bg: 'rgba(245,158,11,0.12)' },
    };
    const c = config[type] || config.text;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '4px 12px', borderRadius: '20px',
        background: c.bg, fontSize: '0.8rem', fontWeight: 500,
        color: 'var(--text-secondary)',
      }}>
        {c.icon} {c.label}
      </span>
    );
  };

  return (
    <div className="app-wrapper flex-col">
      <Navbar />

      {/* ── Toast notifications ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast-notification toast-${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>

      {isReady && currentQuestion ? (
        <div className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>

          <ProgressDots />

          {/* Header panel */}
          <div className="glass-panel interview-header">
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ color: 'var(--text-secondary)' }}>Question {currentQuestionIndex + 1} of {questions.length}</h3>
                <TypeBadge type={questionType} />
              </div>
              <h2 style={{ fontSize: '1.5rem', marginTop: '8px' }}>{currentQuestion.text}</h2>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{
                fontSize: '2rem', fontWeight: 'bold',
                color: secondsLeft < 30 ? 'var(--danger)' : 'var(--primary-color)',
                transition: 'color 0.3s',
              }}>
                {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                TIME LEFT
              </div>
            </div>
          </div>

          {/* ── Follow-Up Modal ── */}
          {showFollowUp && (
            <div className="follow-up-modal glass-panel" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ color: 'var(--accent-color)' }}>⚡ Quick Follow-Up</h3>
                <div style={{
                  fontSize: '1.2rem', fontWeight: 'bold',
                  color: followUpSecondsLeft < 15 ? 'var(--danger)' : 'var(--warning)',
                }}>
                  {Math.floor(followUpSecondsLeft / 60)}:{(followUpSecondsLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <p style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.05rem', lineHeight: 1.5 }}>
                {followUpQuestion}
              </p>
              <textarea
                className="input-field"
                style={{ minHeight: '100px', resize: 'vertical', marginBottom: '12px' }}
                value={followUpAnswer}
                onChange={(e) => setFollowUpAnswer(e.target.value)}
                placeholder="Type your follow-up answer..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" onClick={handleFollowUpSubmit} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit & Continue ➔'}
                </button>
              </div>
            </div>
          )}

          {/* ── Loading follow-up indicator ── */}
          {followUpLoading && (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '20px', marginBottom: '16px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>🤖 Generating follow-up question...</p>
            </div>
          )}

          {/* Answer area */}
          {!showFollowUp && !followUpLoading && (
            <div className="interview-main">
              <div className="glass-panel interview-controls" style={{ flex: 1, maxWidth: '900px', margin: '0 auto', width: '100%' }}>

                {questionType === 'text' && (
                  <>
                    <h3 style={{ marginBottom: '16px' }}>Your Answer</h3>
                    <textarea
                      id="answer-textarea"
                      className="input-field"
                      style={{ flex: 1, minHeight: '220px', resize: 'vertical' }}
                      value={liveAnswer}
                      onChange={(e) => setLiveAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                    />
                  </>
                )}

                {(questionType === 'coding' || questionType === 'bugfix') && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <h3>{questionType === 'bugfix' ? 'Fix the Code' : 'Write Your Code'}</h3>
                      <LanguageBadge lang={questionLanguage} />
                    </div>
                    <div className="code-editor-wrapper">
                      <div className="code-editor-line-numbers" aria-hidden="true">
                        {(liveAnswer || '').split('\n').map((_, i) => (
                          <span key={i}>{i + 1}</span>
                        ))}
                      </div>
                      <textarea
                        id="code-editor-textarea"
                        className="code-editor-textarea"
                        value={liveAnswer}
                        onChange={(e) => setLiveAnswer(e.target.value)}
                        placeholder={questionType === 'bugfix' ? 'Fix the bugs in the code...' : 'Write your code here...'}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoCorrect="off"
                      />
                    </div>
                  </>
                )}

                <div className="interview-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={handleNext} disabled={submitting || followUpLoading}>
                    {submitting ? 'Submitting...' : (currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question ➔')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="container flex-center" style={{ flex: 1, minHeight: '80vh' }}>
          <h1>Loading Interview Environment...</h1>
        </div>
      )}
    </div>
  );
};

export default InterviewPage;
