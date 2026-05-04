// === FILE: client/src/components/SplashIntro.jsx ===
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DURATION = 4000;

export default function SplashIntro({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [done, setDone] = useState(false);

  // Progress bar
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / DURATION, 1);
      setProgress(p * 100);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);

  // Tagline fades in after icon settles
  useEffect(() => {
    const t = setTimeout(() => setShowTagline(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Exit
  useEffect(() => {
    const t = setTimeout(() => {
      setDone(true);
      setTimeout(() => onComplete?.(), 650);
    }, DURATION);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeInOut' }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center"
          style={{ background: '#060810' }}
        >
          {/* Subtle grid */}
          <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

          {/* Gold orb top-left */}
          <div
            className="orb pointer-events-none"
            style={{ width: 600, height: 600, background: '#F0B429', top: '-20%', left: '-15%', opacity: 0.07 }}
          />
          {/* Blue orb bottom-right */}
          <div
            className="orb pointer-events-none"
            style={{ width: 450, height: 450, background: '#6366f1', bottom: '-15%', right: '-10%', opacity: 0.055 }}
          />

          {/* Slow rotating ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
            style={{
              width: 480,
              height: 480,
              marginLeft: -240,
              marginTop: -240,
              border: '1px solid rgba(240,180,41,0.07)',
            }}
          />

          {/* ── Center content ── */}
          <div className="relative z-10 flex flex-col items-center text-center px-6">

            {/* Icon mark */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.1 }}
              className="mb-7"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #F0B429 0%, #E07B39 100%)',
                  boxShadow: '0 0 48px -8px rgba(240,180,41,0.55)',
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L1 9l11 6 11-6-11-6z" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 15l11 6 11-6" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.65"/>
                  <path d="M1 12l11 6 11-6" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>
                </svg>
              </div>
            </motion.div>

            {/* Wordmark — slides up as one unit */}
            <div style={{ overflow: 'hidden', marginBottom: '0.5rem' }}>
              <motion.h1
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
                style={{
                  fontFamily: 'Sora, sans-serif',
                  fontSize: 'clamp(3rem, 8vw, 5.5rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.045em',
                  lineHeight: 1,
                  background: 'linear-gradient(135deg, #ffd97d 0%, #F0B429 55%, #E07B39 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                EduScope
              </motion.h1>
            </div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={showTagline ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                color: '#475569',
                fontSize: '0.72rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 500,
                marginBottom: '2.5rem',
              }}
            >
              Intelligent Classroom Engagement
            </motion.p>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              style={{ width: '14rem' }}
            >
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div
                className="mt-2.5 font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: '#334155' }}
              >
                {Math.round(progress)}%
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
