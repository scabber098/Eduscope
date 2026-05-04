// === FILE: client/src/pages/JoinSession.jsx ===
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../components/Logo';
import { SessionAPI } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function JoinSession() {
  const [code, setCode] = useState(['','','','','','']);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [step, setStep] = useState('code');
  const [success, setSuccess] = useState(false);
  const inputs = useRef([]);
  const toast = useToast();
  const nav = useNavigate();
  const hasToken = !!localStorage.getItem('pollcast_token');

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  const handleInput = (i, val) => {
    const v = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 1);
    const next = [...code]; next[i] = v; setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };
  const handleKey = (i, e) => { if (e.key === 'Backspace' && !code[i] && i > 0) inputs.current[i-1]?.focus(); };
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

  const proceedToName = () => {
    if (!codeReady) return;
    if (hasToken) { doJoin(full); return; }
    setStep('name');
  };

  const doJoin = async (c) => {
    if (joining) return; setJoining(true);
    try {
      const data = await SessionAPI.join(c || full, name.trim() || 'Anonymous');
      setSuccess(true);
      await new Promise(r => setTimeout(r, 400));
      // Store session data so LiveSession can load even in incognito
      try { sessionStorage.setItem('pollcast_session', JSON.stringify(data)); } catch(e) {}
      // Store IDs separately for backend rehydration on page refresh
      try { sessionStorage.setItem('pollcast_session_ids', JSON.stringify({ sessionId: data.session.id, participantId: data.participant.id })); } catch(e) {}
      // Also store in a ref-safe way for navigation
      window.__pollcast_session = data;
      nav('/live-session');
    } catch (err) {
      setSuccess(false);
      const status = err.response?.status;
      const msg = err.response?.data?.error;
      if (status === 410) {
        toast.error(msg || 'Session has expired or ended.');
      } else if (status === 404) {
        toast.error(msg || 'Invalid session code. Check with your professor.');
      } else {
        toast.error(msg || 'Could not join session. Try again.');
      }
    } finally { setJoining(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#060810' }}>
      {/* Grid bg */}
      <div className="absolute inset-0 grid-bg opacity-30" />
      {/* Orbs */}
      <div className="orb w-[500px] h-[500px]" style={{ background:'#F0B429', top:'-20%', left:'10%' }}/>
      <div className="orb w-[350px] h-[350px]" style={{ background:'#6366f1', bottom:'-10%', right:'10%', opacity:0.07 }}/>

      <motion.div
        initial={{ opacity:0, y:24, scale:0.97 }}
        animate={{ opacity:1, y:0, scale:1 }}
        transition={{ duration:0.55, ease:[0.25,0.1,0.25,1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <Logo size={44} animated/>
            <span className="font-display text-2xl font-bold" style={{ color:'#f1f5f9', letterSpacing:'-0.03em' }}>EduScope</span>
          </Link>
          <div className="text-xs font-mono tracking-[0.2em] uppercase mt-2" style={{ color:'#334155' }}>
            Student Portal
          </div>
        </div>

        <div className="glass p-8 md:p-10">
          <AnimatePresence mode="wait">
            {step === 'code' ? (
              <motion.div key="code"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                transition={{ duration:0.3 }}>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl"
                    style={{ background:'rgba(240,180,41,0.1)', border:'1px solid rgba(240,180,41,0.2)' }}>
                    🔑
                  </div>
                  <h1 className="font-display text-3xl font-bold mb-2" style={{ color:'#f1f5f9' }}>Join Session</h1>
                  <p className="text-sm" style={{ color:'#64748b' }}>Enter the 6-character code from your professor</p>
                </div>

                {/* Code inputs */}
                <div className="flex justify-center gap-2 md:gap-3 mb-8" onPaste={handlePaste}>
                  {code.map((c, i) => (
                    <motion.input
                      key={i} ref={el => inputs.current[i] = el}
                      type="text" maxLength={1} value={c}
                      onChange={e => handleInput(i, e.target.value)}
                      onKeyDown={e => handleKey(i, e)}
                      initial={{ opacity:0, y:12 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay: i * 0.06 }}
                      className="w-11 h-14 md:w-13 md:h-16 text-center text-2xl font-bold font-mono rounded-xl border-2 focus:outline-none transition-all"
                      style={{
                        background: 'rgba(6,8,16,0.8)',
                        borderColor: success ? '#22c55e' : c ? '#F0B429' : 'rgba(255,255,255,0.1)',
                        color: '#f1f5f9',
                        boxShadow: c ? '0 0 20px -6px rgba(240,180,41,0.25)' : 'none',
                      }}
                    />
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={proceedToName}
                  disabled={!codeReady || joining}
                  className="btn-primary w-full justify-center text-base"
                >
                  {joining
                    ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                        className="w-5 h-5 border-2 border-[#060810]/40 border-t-[#060810] rounded-full"/>
                    : <>Continue <span>→</span></>
                  }
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="name"
                initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
                transition={{ duration:0.3 }}>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center text-2xl"
                    style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
                    👤
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-1" style={{ color:'#f1f5f9' }}>What's your name?</h2>
                  <p className="text-sm" style={{ color:'#64748b' }}>So your professor can identify you</p>
                </div>

                {/* Code badge */}
                <div className="text-center mb-5">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono font-bold text-sm"
                    style={{ background:'rgba(240,180,41,0.08)', color:'#F0B429', border:'1px solid rgba(240,180,41,0.2)' }}>
                    🔑 Code: {full}
                  </span>
                </div>

                <input
                  className="input-field mb-4" value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && doJoin()}
                  placeholder="Your full name"
                  autoFocus
                />

                <motion.button
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                  onClick={() => doJoin()}
                  disabled={joining || !name.trim()}
                  className="btn-primary w-full justify-center text-base mb-3"
                >
                  {joining
                    ? <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                        className="w-5 h-5 border-2 border-[#060810]/40 border-t-[#060810] rounded-full"/>
                    : <>🚀 Enter Session</>
                  }
                </motion.button>

                <button onClick={() => setStep('code')} className="w-full text-center text-sm hover:underline" style={{ color:'#475569' }}>
                  ← Change code
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-5 border-t text-center text-sm" style={{ borderColor:'rgba(255,255,255,0.06)', color:'#334155' }}>
            <Link to="/auth" className="hover:text-[#F0B429] transition-colors">Sign in with your account instead</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
