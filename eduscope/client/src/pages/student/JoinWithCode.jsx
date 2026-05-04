// === FILE: client/src/pages/student/JoinWithCode.jsx ===
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function JoinWithCode() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [joining, setJoining] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputs = useRef([]);
  const toast = useToast();
  const nav = useNavigate();
  const { user } = useAuth();

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleInput = (i, val) => {
    const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const txt = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    const next = [...code];
    for (let i = 0; i < 6; i++) next[i] = txt[i] || '';
    setCode(next);
    inputs.current[Math.min(txt.length, 5)]?.focus();
  };

  const full = code.join('');
  const codeReady = full.length === 6;

  const doJoin = async () => {
    if (!codeReady || joining) return;
    setJoining(true);
    try {
      // Use student's real name from auth
      const data = await SessionAPI.join(full, user?.name || 'Student');
      setSuccess(true);
      console.log('[JoinWithCode] session joined:', data);
      // Store session data for LiveSession page
      try { sessionStorage.setItem('pollcast_session', JSON.stringify(data)); } catch (e) {}
      try {
        sessionStorage.setItem('pollcast_session_ids', JSON.stringify({
          sessionId: data.session.id,
          participantId: data.participant.id,
        }));
      } catch (e) {}
      window.__pollcast_session = data;
      await new Promise(r => setTimeout(r, 350));
      nav('/live-session');
    } catch (err) {
      setSuccess(false);
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      if (status === 410) toast.error(msg || 'Session has expired or ended.');
      else if (status === 404) toast.error(msg || 'Invalid code. Check with your professor.');
      else toast.error(msg || 'Could not join. Try again.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>Join with Code</h2>
        <p className="text-sm mt-1" style={{ color: '#8B949E' }}>
          Enter the 6-character code from your professor to join a live session.
        </p>
      </div>

      <div className="max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="glass p-8 md:p-10"
        >
          {/* Icon */}
          <div className="text-center mb-8">
            <motion.div
              animate={success ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
              className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
              style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)' }}
            >
              {success ? '✅' : '🔑'}
            </motion.div>
            <p className="text-sm font-medium" style={{ color: '#8B949E' }}>
              Joining as <span style={{ color: '#F0B429' }}>{user?.name}</span>
            </p>
          </div>

          {/* Code boxes */}
          <div className="flex justify-center gap-2 md:gap-3 mb-8" onPaste={handlePaste}>
            {code.map((c, i) => (
              <motion.input
                key={i}
                ref={el => inputs.current[i] = el}
                type="text"
                maxLength={1}
                value={c}
                onChange={e => handleInput(i, e.target.value)}
                onKeyDown={e => handleKey(i, e)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-bold font-mono rounded-xl border-2 focus:outline-none transition-all"
                style={{
                  background: 'rgba(10,13,18,0.8)',
                  borderColor: success ? '#3FB950' : c ? '#F0B429' : 'rgba(240,234,214,0.1)',
                  color: '#F0EAD6',
                  boxShadow: c ? '0 0 20px -6px rgba(240,180,41,0.25)' : 'none',
                }}
              />
            ))}
          </div>

          {/* Join button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={doJoin}
            disabled={!codeReady || joining}
            className="btn-primary w-full justify-center text-base"
          >
            {joining ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-[#0A0D12]/40 border-t-[#0A0D12] rounded-full"
              />
            ) : success ? (
              '✅ Joining…'
            ) : (
              <>🚀 Join Session</>
            )}
          </motion.button>

          {/* Helper */}
          <p className="text-center text-xs mt-5" style={{ color: '#4a5060' }}>
            Your professor will share the code at the start of class.
          </p>
        </motion.div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {[
            { icon: '⚡', title: 'Instant Join', desc: 'Enter code, join live instantly' },
            { icon: '🏆', title: 'Earn Points', desc: 'Correct answers earn points. Participation counts too!' },
          ].map(card => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-4"
            >
              <div className="text-xl mb-2">{card.icon}</div>
              <div className="font-semibold text-sm mb-1" style={{ color: '#F0EAD6' }}>{card.title}</div>
              <div className="text-xs" style={{ color: '#8B949E' }}>{card.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
