// NEW FILE: client/src/components/PollTimerBadge.jsx
// Shows a live countdown when a poll has a duration.
// Calls PollTimerAPI.start() on mount, then auto-submits when time runs out.
// Does NOT modify any existing poll component.
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PollTimerAPI } from '../api/client';

function fmt(ms) {
  if (ms <= 0) return '0:00';
  const totalSec = Math.ceil(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Props:
 *   pollId      — string
 *   duration    — number (minutes), null/0 = no timer
 *   onExpired   — callback(answerIndex) called when timer hits 0; pass current answer
 *   getAnswer   — () => number (current selected answerIndex, -1 if none)
 */
export default function PollTimerBadge({ pollId, duration, onExpired, getAnswer }) {
  const [remaining, setRemaining] = useState(null); // ms
  const [expired, setExpired]     = useState(false);
  const [started, setStarted]     = useState(false);
  const intervalRef               = useRef(null);
  const firedRef                  = useRef(false);

  useEffect(() => {
    if (!pollId || !duration) return;

    PollTimerAPI.start(pollId)
      .then((data) => {
        setStarted(true);
        if (data.expired) {
          setExpired(true);
          setRemaining(0);
          return;
        }
        const rem = data.timeRemainingMs ?? (duration * 60 * 1000);
        setRemaining(rem);

        // Tick every second
        intervalRef.current = setInterval(() => {
          setRemaining((prev) => {
            const next = prev - 1000;
            if (next <= 0) {
              clearInterval(intervalRef.current);
              setExpired(true);
              return 0;
            }
            return next;
          });
        }, 1000);
      })
      .catch((err) => console.warn('[PollTimerBadge] start failed:', err.message));

    return () => clearInterval(intervalRef.current);
  }, [pollId, duration]);

  // Fire auto-submit once
  useEffect(() => {
    if (expired && !firedRef.current) {
      firedRef.current = true;
      const ans = typeof getAnswer === 'function' ? getAnswer() : -1;
      PollTimerAPI.autoSubmit(pollId, ans)
        .then(() => onExpired?.(ans))
        .catch((err) => {
          console.warn('[PollTimerBadge] auto-submit failed:', err.message);
          onExpired?.(ans); // still notify parent
        });
    }
  }, [expired, pollId, getAnswer, onExpired]);

  if (!duration) return null;
  if (!started)  return null;

  const pct     = remaining != null ? Math.max(0, remaining / (duration * 60 * 1000)) : 1;
  const urgent  = remaining != null && remaining < 30_000;
  const warning = remaining != null && remaining < 60_000;
  const color   = expired ? '#F85149' : urgent ? '#F85149' : warning ? '#F0B429' : '#3FB950';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 px-4 py-2 rounded-xl"
        style={{
          background: `rgba(${expired ? '248,81,73' : urgent ? '248,81,73' : warning ? '240,180,41' : '63,185,80'}, 0.08)`,
          border: `1px solid rgba(${expired ? '248,81,73' : urgent ? '248,81,73' : warning ? '240,180,41' : '63,185,80'}, 0.25)`,
        }}
      >
        {/* Circular progress */}
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
          <circle
            cx="16" cy="16" r="13"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${(1 - pct) * 2 * Math.PI * 13}`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>

        <div>
          <div className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>
            {expired ? "Time's up!" : 'Time left'}
          </div>
          <motion.div
            key={expired ? 'expired' : Math.ceil((remaining ?? 0) / 1000)}
            initial={{ scale: urgent && !expired ? 1.15 : 1 }}
            animate={{ scale: 1 }}
            className="font-mono font-bold text-lg leading-none"
            style={{ color }}
          >
            {expired ? '0:00' : fmt(remaining ?? 0)}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
