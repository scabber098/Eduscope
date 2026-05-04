// === FILE: client/src/pages/student/ActivePolls.jsx ===
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PollAPI, ResponseAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useSocketEvents } from '../../hooks/useSocket';
import { SkeletonCard } from '../../components/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PollTimerBadge from '../../components/PollTimerBadge';

export default function ActivePolls() {
  const [polls, setPolls] = useState(null);
  const [submittedPolls, setSubmittedPolls] = useState({}); // pollId → { correct, pointsEarned }
  const selectedAnswers = useRef({}); // pollId → last tapped answerIndex (for timer auto-submit)
  const toast = useToast();
  const { logout } = useAuth();
  const nav = useNavigate();

  const load = useCallback(async () => {
    try { setPolls(await PollAPI.activeForStudent()); } catch { setPolls([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useSocketEvents(useMemo(() => ({
    'poll:open': ({ poll }) => {
      setPolls(p => { if (!p) return p; if (p.find(x => x.id === poll.id)) return p; return [poll, ...p]; });
      toast.info('New poll live!');
    },
    'poll:close': ({ pollId }) => {
      setPolls(p => p ? p.filter(x => x.id !== pollId) : p);
    },
  }), [toast]));

  const handleAnswer = async (pollId, answerIndex) => {
    // Track last selected answer so timer auto-submit can read it
    if (answerIndex >= 0) selectedAnswers.current[pollId] = answerIndex;
    if (answerIndex < 0) return; // auto-submit with no answer selected — skip API call
    try {
      const result = await ResponseAPI.submit(pollId, answerIndex);
      console.log('[ActivePolls] submit response:', result);

      setSubmittedPolls(prev => ({
        ...prev,
        [pollId]: {
          correct: result.correct,
          pointsEarned: result.pointsEarned ?? 0,
          answerIndex,
        },
      }));

      if (result.correct === true) {
        toast.success(`✅ Correct! +${result.pointsEarned} points`);
      } else if (result.correct === false) {
        toast.error('❌ Incorrect. Better luck next time!');
      } else {
        toast.success(`✅ Answered! +${result.pointsEarned} point`);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to submit';
      if (msg === 'Already answered') {
        toast.info('You already answered this poll.');
      } else {
        toast.error(msg);
      }
    }
  };

  const handleSignInAgain = () => {
    logout();
    nav('/auth?role=student', { replace: true });
  };

  if (polls === null) return <div className="grid gap-5"><SkeletonCard /><SkeletonCard /></div>;

  // Check if all polls have been answered
  const allAnswered = polls.length > 0 && polls.every(p => submittedPolls[p.id]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>Active Polls</h2>
        <p className="text-sm mt-1" style={{ color: '#8B949E' }}>
          Answer polls as your professor launches them.
        </p>
      </div>

      {polls.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-12 text-center">
          <div className="text-5xl mb-4 opacity-40">∙∙∙</div>
          <h3 className="font-display text-2xl mb-2" style={{ color: '#F0EAD6' }}>No active polls right now</h3>
          <p style={{ color: '#8B949E' }}>Polls appear instantly when your professor launches them.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button onClick={load} className="btn-ghost inline-flex items-center gap-2">
              ↻ Refresh
            </button>
            <button onClick={handleSignInAgain} className="btn-primary inline-flex items-center gap-2">
              🔄 Sign In Again
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {allAnswered && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="glass p-5 flex items-center justify-between"
              style={{ borderLeft: '4px solid #3FB950' }}>
              <div>
                <div className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>
                  ✅ All polls answered!
                </div>
                <div className="text-sm" style={{ color: '#8B949E' }}>
                  Your marks have been saved. Sign in again or wait for more polls.
                </div>
              </div>
              <button onClick={handleSignInAgain} className="btn-primary !py-2 !px-4 text-sm whitespace-nowrap">
                🔄 Sign In Again
              </button>
            </motion.div>
          )}

          <AnimatePresence>
            {polls.map(p => {
              const submitted = submittedPolls[p.id];
              return (
                <motion.div key={p.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-6">
                  <div className="text-xs uppercase tracking-widest mb-2" style={{ color: '#8B949E' }}>
                    {p.lecture_name || 'Live Poll'}
                  </div>
                  <h3 className="font-display text-xl mb-4" style={{ color: '#F0EAD6' }}>{p.question}</h3>

                  {submitted ? (
                    <div className="space-y-2">
                      {p.options?.map((opt, i) => {
                        const isSelected = i === submitted.answerIndex;
                        const isCorrect = p.correct_index != null ? i === p.correct_index : null;
                        let bg = 'rgba(240,234,214,0.04)';
                        let border = 'rgba(240,234,214,0.08)';
                        if (isSelected && submitted.correct === true) { bg = 'rgba(63,185,80,0.12)'; border = '#3FB950'; }
                        else if (isSelected && submitted.correct === false) { bg = 'rgba(248,81,73,0.12)'; border = '#F85149'; }
                        else if (isSelected) { bg = 'rgba(240,180,41,0.1)'; border = '#F0B429'; }
                        else if (isCorrect === true) { bg = 'rgba(63,185,80,0.06)'; border = 'rgba(63,185,80,0.3)'; }
                        return (
                          <div key={i} className="px-4 py-3 rounded-xl text-sm" style={{ background: bg, border: `1px solid ${border}`, color: '#F0EAD6' }}>
                            {isSelected ? (submitted.correct === true ? '✓ ' : submitted.correct === false ? '✕ ' : '● ') : isCorrect === true ? '✓ ' : '  '}{opt}
                          </div>
                        );
                      })}
                      <div className="text-xs mt-2 font-medium" style={{ color: submitted.correct === true ? '#3FB950' : submitted.correct === false ? '#F85149' : '#F0B429' }}>
                        {submitted.correct === true ? `Correct! +${submitted.pointsEarned} points` : submitted.correct === false ? 'Incorrect' : `Answered ● +${submitted.pointsEarned} point`}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* NEW: Poll countdown timer — only shown when poll has a duration */}
                      {p.duration && (
                        <div className="mb-3">
                          <PollTimerBadge
                            pollId={p.id}
                            duration={p.duration}
                            getAnswer={() => selectedAnswers.current[p.id] ?? -1}
                            onExpired={(ans) => handleAnswer(p.id, ans)}
                          />
                        </div>
                      )}
                      {p.options?.map((opt, i) => (
                        <motion.button key={i} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            selectedAnswers.current[p.id] = i; // track before submit
                            handleAnswer(p.id, i);
                          }}
                          className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all"
                          style={{ background: 'rgba(240,234,214,0.04)', border: '1px solid rgba(240,234,214,0.08)', color: '#F0EAD6' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#F0B429'; e.currentTarget.style.background = 'rgba(240,180,41,0.06)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(240,234,214,0.08)'; e.currentTarget.style.background = 'rgba(240,234,214,0.04)'; }}>
                          {opt}
                        </motion.button>
                      ))}
                      <div className="text-xs mt-1" style={{ color: '#4a5060' }}>{p.options?.length} options · tap to answer</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
