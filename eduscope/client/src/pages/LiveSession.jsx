// === FILE: client/src/pages/LiveSession.jsx ===
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { SessionAPI, StudentAPI } from '../api/client';
import { useToast } from '../context/ToastContext';
import { useSessionRoom, useSocketEvents } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

// ─── Anti-cheat Warning Modal ─────────────────────────────────────────────────
function WarningModal({ onClose }) {
  return (
    <motion.div
      key="warn-bg"
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.8)', backdropFilter:'blur(16px)' }}
    >
      <motion.div
        initial={{ opacity:0, scale:0.8, y:40 }}
        animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.8 }}
        transition={{ type:'spring', stiffness:280, damping:22 }}
        className="glass max-w-md w-full p-8 text-center"
        style={{ borderColor:'rgba(249,115,22,0.45)', boxShadow:'0 0 80px -20px rgba(249,115,22,0.3)' }}
      >
        {/* Warning icon */}
        <motion.div
          animate={{ scale:[1, 1.08, 1] }}
          transition={{ repeat:3, duration:0.4 }}
          className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
          style={{ background:'rgba(249,115,22,0.12)', border:'2px solid rgba(249,115,22,0.3)' }}
        >
          <span style={{ fontSize:36 }}>⚠️</span>
        </motion.div>

        <div className="badge badge-orange mx-auto mb-4">Anti-Cheat Warning</div>

        <h2 className="font-display text-2xl font-bold mb-3" style={{ color:'#f97316' }}>
          Tab Switch Detected
        </h2>
        <p className="mb-2 leading-relaxed" style={{ color:'#94a3b8' }}>
          You switched away from this tab. This has been flagged and reported to your professor.
        </p>
        <p className="text-sm font-semibold mb-8 px-4 py-3 rounded-xl"
          style={{ background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}>
          ⚡ One more tab switch = automatic disqualification.
        </p>

        <motion.button
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={onClose}
          className="btn-primary w-full justify-center"
        >
          I Understand — Continue
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ─── Disqualification Screen ──────────────────────────────────────────────────
function DisqualifiedScreen({ onHome }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background:'rgba(0,0,0,0.97)', backdropFilter:'blur(20px)' }}
    >
      {/* Red radial glow bg */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(circle at 50% 40%, rgba(239,68,68,0.12) 0%, transparent 65%)' }}/>

      <motion.div
        initial={{ scale:0.85, y:30, opacity:0 }}
        animate={{ scale:1, y:0, opacity:1 }}
        transition={{ type:'spring', stiffness:200, damping:22, delay:0.1 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated X icon */}
        <motion.div
          animate={{ scale:[1, 1.1, 0.95, 1] }}
          transition={{ repeat:2, duration:0.5, delay:0.3 }}
          className="w-28 h-28 rounded-full mx-auto mb-8 flex items-center justify-center"
          style={{ background:'rgba(239,68,68,0.1)', border:'2px solid rgba(239,68,68,0.35)', boxShadow:'0 0 80px -20px rgba(239,68,68,0.5)' }}
        >
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </motion.div>

        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.4 }}>
          <div className="badge badge-red mx-auto mb-5">Session Terminated</div>
          <h1 className="font-display text-5xl font-bold mb-4" style={{ color:'#ef4444' }}>Disqualified</h1>
          <p className="text-base leading-relaxed mb-3" style={{ color:'#94a3b8', maxWidth:'34ch', margin:'0 auto 12px' }}>
            You switched tabs multiple times during the session. Your responses have been flagged and your professor has been notified.
          </p>
          <p className="text-sm mb-10 font-mono" style={{ color:'#475569' }}>
            This action is final for this session.
          </p>

          <motion.button
            whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
            onClick={onHome}
            className="btn-ghost !px-10"
          >
            Return to Home
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main LiveSession ─────────────────────────────────────────────────────────
export default function LiveSession() {
  const nav = useNavigate();
  const toast = useToast();
  const { isAuthed } = useAuth();
  const goHome = () => nav(isAuthed ? '/student' : '/', { replace: true });
  const [data, setData] = useState(() => {
    try {
      const stored = sessionStorage.getItem('pollcast_session');
      if (stored) return JSON.parse(stored);
    } catch {}
    // Fallback for incognito/restricted storage
    return window.__pollcast_session || null;
  });
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [cheatStatus, setCheatStatus] = useState('active');
  const [showWarning, setShowWarning] = useState(false);
  const [showDQ, setShowDQ] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const tabSwitchCount = useRef(0);
  const [fsWarning, setFsWarning] = useState(false);

  // ── Fullscreen enforcement ──────────────────────────────────────────────────
  // Enter fullscreen as soon as session data is available.
  useEffect(() => {
    if (!data) return;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    return () => {
      if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [!!data]);

  // Warn if student exits fullscreen
  useEffect(() => {
    if (!data) return;
    const handler = () => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs) setFsWarning(true);
    };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      document.removeEventListener('webkitfullscreenchange', handler);
    };
  }, [!!data]);

  const session     = data?.session;
  const participant = data?.participant;
  const polls       = data?.polls || [];
  const initialAnswered = data?.answered || [];

  // Rehydrate session from backend if we have session+participant IDs
  // This fixes blank screen on page refresh or navigation back
  useEffect(() => {
    if (data) {
      initialAnswered.forEach(pid => setSubmitted(s => ({ ...s, [pid]: true })));
      return;
    }
    // No data in memory — try to rehydrate from sessionStorage IDs
    let sessionId, participantId;
    try {
      const stored = sessionStorage.getItem('pollcast_session_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        sessionId = parsed.sessionId;
        participantId = parsed.participantId;
      }
    } catch {}

    if (!sessionId || !participantId) {
      nav(isAuthed ? '/student' : '/join', { replace: true });
      return;
    }

    // Fetch from backend
    setLoading(true);
    SessionAPI.validate(sessionId, participantId)
      .then(result => {
        if (result.valid) {
          setData(result);
          // Re-store full data
          try { sessionStorage.setItem('pollcast_session', JSON.stringify(result)); } catch {}
          window.__pollcast_session = result;
          (result.answered || []).forEach(pid => setSubmitted(s => ({ ...s, [pid]: true })));
        } else {
          toast.error(result.reason === 'closed' ? 'Session has ended.' : 'Session expired or invalid.');
          nav(isAuthed ? '/student' : '/join', { replace: true });
        }
      })
      .catch(() => {
        toast.error('Could not reconnect to session.');
        nav(isAuthed ? '/student' : '/join', { replace: true });
      })
      .finally(() => setLoading(false));
  }, []);

  useSessionRoom(session?.id);

  // Anti-cheat — stop listening once session ended or already DQ'd
  useEffect(() => {
    if (!participant || cheatStatus === 'disqualified' || sessionEnded) return;
    const handler = () => {
      if (document.hidden) {
        tabSwitchCount.current += 1;
        SessionAPI.reportTabSwitch(participant.id).then(res => {
          setCheatStatus(res.status);
          if (res.status === 'warned') setShowWarning(true);
          else if (res.status === 'disqualified') { setShowWarning(false); setShowDQ(true); }
        }).catch(() => {});
        // EXTEND: also log to student activity tracker (Feature 2)
        StudentAPI.logActivity('TAB_SWITCH', tabSwitchCount.current).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [participant, cheatStatus, sessionEnded]);

  useSocketEvents(useMemo(() => ({
    'session:closed': () => setSessionEnded(true),
    'poll:update': () => {},
  }), []));

  const poll   = polls[currentQ];
  const totalQ = polls.length;
  const allDone = polls.every(p => submitted[p.id]);

  const selectAnswer = (idx) => {
    if (submitted[poll?.id] || cheatStatus === 'disqualified') return;
    setAnswers(a => ({ ...a, [poll.id]: idx }));
  };

  const submitAnswer = async () => {
    if (!poll || submitting || submitted[poll.id] || answers[poll.id] == null || cheatStatus === 'disqualified') return;
    setSubmitting(true);
    try {
      const res = await SessionAPI.answer(poll.id, participant.id, answers[poll.id]);
      setSubmitted(s => ({ ...s, [poll.id]: true }));
      if (res.correct) {
        confetti({ particleCount:100, spread:65, origin:{ y:0.65 }, colors:['#F0B429','#ffd97d','#22c55e','#f1f5f9'], disableForReducedMotion:true });
        toast.success(`✅ Correct! +${res.pointsEarned ?? 10} points`);
      } else if (res.correct === false) {
        toast.error('❌ Incorrect. Better luck next time!');
      } else {
        toast.success('Answer submitted');
      }
      if (currentQ < totalQ - 1) setTimeout(() => setCurrentQ(c => c + 1), 1500);
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Already answered (re-join scenario) — mark as submitted silently
        setSubmitted(s => ({ ...s, [poll.id]: true }));
        if (currentQ < totalQ - 1) setTimeout(() => setCurrentQ(c => c + 1), 800);
      } else {
        toast.error(err.response?.data?.error || 'Failed to submit');
      }
    } finally { setSubmitting(false); }
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background:'#060810' }}>
        {loading ? (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center">
            <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
              className="w-10 h-10 border-3 border-[#F0B429]/30 border-t-[#F0B429] rounded-full mx-auto mb-4"/>
            <p className="text-sm" style={{ color:'#64748b' }}>Reconnecting to session…</p>
          </motion.div>
        ) : null}
      </div>
    );
  }

  // Full-screen modals — DQ only shows if session is still active
  if ((showDQ || cheatStatus === 'disqualified') && !sessionEnded) {
    return <DisqualifiedScreen onHome={goHome} />;
  }

  if (sessionEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'#060810' }}>
        <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="glass p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color:'#f1f5f9' }}>Session Ended</h1>
          <p style={{ color:'#64748b' }}>Your professor has closed this session. Thank you for participating!</p>
          <button onClick={goHome} className="btn-primary mt-8">Return to Dashboard</button>
        </motion.div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background:'#060810' }}>
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="glass p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-6">✅</div>
          <h1 className="font-display text-3xl font-bold mb-3" style={{ color:'#f1f5f9' }}>All Done!</h1>
          <p className="mb-1" style={{ color:'#64748b' }}>You've answered all {totalQ} questions.</p>
          <p className="text-sm mb-6" style={{ color:'#475569' }}>Your marks have been saved. Great work!</p>
          <button onClick={goHome} className="btn-primary">
            {isAuthed ? '→ Go to Dashboard' : '→ Return to Home'}
          </button>
        </motion.div>
      </div>
    );
  }

  const progressPct = ((currentQ + (submitted[poll?.id] ? 1 : 0)) / totalQ) * 100;

  return (
    <div className="min-h-screen relative" style={{ background:'#060810' }}>
      <div className="orb w-[400px] h-[400px] -top-32 -right-32" style={{ background:'#F0B429' }}/>

      {/* Warning modal */}
      <AnimatePresence>
        {showWarning && <WarningModal onClose={() => setShowWarning(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {fsWarning && (
          <motion.div key="fs-warn" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:250, display:'flex', alignItems:'center', justifyContent:'center', padding:16,
              background:'rgba(0,0,0,0.88)', backdropFilter:'blur(14px)' }}>
            <motion.div initial={{ scale:0.85, y:30 }} animate={{ scale:1, y:0 }} exit={{ scale:0.85 }}
              transition={{ type:'spring', stiffness:280, damping:22 }}
              className="glass max-w-sm w-full p-8 text-center"
              style={{ borderColor:'rgba(240,180,41,0.4)', boxShadow:'0 0 80px -20px rgba(240,180,41,0.25)' }}>
              <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(240,180,41,0.1)', border:'2px solid rgba(240,180,41,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', fontSize:28 }}>⛶</div>
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color:'#F0B429' }}>Fullscreen Required</h2>
              <p style={{ color:'#94a3b8', fontSize:14, lineHeight:1.6, marginBottom:20 }}>
                This session must be taken in fullscreen mode. Exiting fullscreen has been flagged. Please return to fullscreen to continue.
              </p>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                className="btn-primary w-full justify-center"
                onClick={() => {
                  const el = document.documentElement;
                  if (el.requestFullscreen) el.requestFullscreen().catch(()=>{});
                  else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                  setFsWarning(false);
                }}>
                ⛶ Return to Fullscreen
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <div className="sticky top-0 z-20 glass-panel border-b px-4 md:px-8"
        style={{ borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="max-w-4xl mx-auto h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={30} animated={false}/>
            <div>
              <div className="text-sm font-semibold" style={{ color:'#f1f5f9' }}>{session?.title}</div>
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color:'#334155' }}>Code: {session?.code}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {cheatStatus === 'warned' && (
              <span className="badge badge-orange">⚠ 1 Warning</span>
            )}
            <span className="text-sm font-mono font-bold" style={{ color:'#F0B429' }}>Q{currentQ+1}/{totalQ}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="progress-track mx-auto" style={{ borderRadius:0, height:3 }}>
          <motion.div animate={{ width:`${progressPct}%` }} transition={{ duration:0.5, ease:'easeOut' }}
            className="progress-fill" style={{ borderRadius:0 }}/>
        </div>
      </div>

      {/* Question area */}
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 relative z-10">
        <AnimatePresence mode="wait">
          {poll && (
            <motion.div key={poll.id}
              initial={{ opacity:0, x:60 }}
              animate={{ opacity:1, x:0 }}
              exit={{ opacity:0, x:-60 }}
              transition={{ duration:0.35, ease:[0.25,0.1,0.25,1] }}
            >
              {/* Q label + tags */}
              <div className="flex items-center gap-2 mb-4">
                <span className="badge badge-gold">Question {currentQ+1}</span>
                {poll.tags?.map(t => (
                  <span key={t} className="badge" style={{ border:'1px solid rgba(255,255,255,0.08)', color:'#64748b' }}>{t}</span>
                ))}
              </div>

              {/* Question text */}
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-8 leading-tight" style={{ color:'#f1f5f9' }}>
                {poll.question}
              </h2>

              {/* Options */}
              <div className="grid gap-3">
                {poll.options.map((opt, idx) => {
                  const selected  = answers[poll.id] === idx;
                  const done      = submitted[poll.id];
                  const isCorrect = done && poll.correct_index === idx;
                  const isWrong   = done && selected && poll.correct_index !== idx && poll.correct_index != null;

                  return (
                    <motion.button key={idx} type="button"
                      disabled={done}
                      onClick={() => selectAnswer(idx)}
                      whileHover={!done ? { x:5, transition:{ duration:0.2 } } : {}}
                      whileTap={!done ? { scale:0.99 } : {}}
                      className="relative text-left p-5 rounded-2xl border-2 transition-all"
                      style={{
                        background: isCorrect ? 'rgba(34,197,94,0.07)'
                          : isWrong    ? 'rgba(239,68,68,0.07)'
                          : selected   ? 'rgba(240,180,41,0.05)'
                          : 'rgba(6,8,16,0.6)',
                        borderColor: isCorrect ? '#22c55e'
                          : isWrong    ? '#ef4444'
                          : selected   ? '#F0B429'
                          : 'rgba(255,255,255,0.08)',
                        opacity: done && !selected && !isCorrect ? 0.45 : 1,
                        boxShadow: selected && !done ? '0 0 24px -8px rgba(240,180,41,0.25)' : 'none',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{
                            background: isCorrect ? 'rgba(34,197,94,0.18)'
                              : isWrong   ? 'rgba(239,68,68,0.18)'
                              : selected  ? 'linear-gradient(135deg,#F0B429,#E07B39)'
                              : 'rgba(255,255,255,0.04)',
                            color: isCorrect ? '#22c55e'
                              : isWrong  ? '#ef4444'
                              : selected ? '#060810'
                              : '#64748b',
                          }}>
                          {isCorrect ? '✓' : isWrong ? '✕' : String.fromCharCode(65+idx)}
                        </div>
                        <span style={{ color:'#f1f5f9' }}>{opt}</span>
                        {isCorrect && (
                          <motion.span initial={{ scale:0 }} animate={{ scale:1 }} className="ml-auto badge badge-green">Correct!</motion.span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Submit bar */}
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm" style={{ color:'#64748b' }}>
                  {submitted[poll.id]
                    ? <span className="flex items-center gap-2" style={{ color:'#22c55e' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Submitted
                      </span>
                    : answers[poll.id] != null ? 'Ready to submit' : 'Select an answer'
                  }
                </div>
                <div className="flex gap-3">
                  {currentQ > 0 && (
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={() => setCurrentQ(c => c-1)} className="btn-ghost !py-3 !px-5">← Prev</motion.button>
                  )}
                  {!submitted[poll.id] ? (
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={submitAnswer}
                      disabled={answers[poll.id] == null || submitting}
                      className="btn-primary !py-3 !px-6">
                      {submitting
                        ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                            className="w-5 h-5 border-2 border-[#060810]/40 border-t-[#060810] rounded-full"/>
                        : 'Submit Answer'}
                    </motion.button>
                  ) : currentQ < totalQ-1 ? (
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                      onClick={() => setCurrentQ(c => c+1)} className="btn-primary !py-3 !px-5">Next →</motion.button>
                  ) : null}
                </div>
              </div>

              {/* Question nav dots */}
              <div className="flex justify-center gap-2 mt-10">
                {polls.map((p, i) => (
                  <button key={p.id} onClick={() => setCurrentQ(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === currentQ ? 24 : 10,
                      height: 10,
                      background: submitted[p.id] ? '#22c55e'
                        : i === currentQ ? '#F0B429'
                        : 'rgba(255,255,255,0.1)',
                    }}/>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
