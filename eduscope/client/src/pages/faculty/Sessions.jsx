// === FILE: client/src/pages/faculty/Sessions.jsx (PATCHED — state persistence fix) ===
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionAPI } from '../../api/client';
import { SkeletonCard } from '../../components/Skeleton';
import LiveDashboard from './LiveDashboard';
import { formatDateTime } from '../../utils/format';

// Persist activeId across tab switches so returning faculty see the dashboard
// instead of a blank screen (the old component remounted fresh on tab change).
const SESSION_STATE_KEY = 'eduscope_active_session';

export default function Sessions() {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Restore active session from sessionStorage (survives tab switches, cleared on tab close)
  const [activeId, setActiveId] = useState(() => {
    try { return sessionStorage.getItem(SESSION_STATE_KEY) || null; }
    catch { return null; }
  });

  const isMounted = useRef(true);
  useEffect(() => { isMounted.current = true; return () => { isMounted.current = false; }; }, []);

  const loadSessions = useCallback(() => {
    setLoading(true);
    setError(null);
    SessionAPI.list()
      .then(d => { if (isMounted.current) setSessions(d); })
      .catch(() => { if (isMounted.current) { setSessions([]); setError('Failed to load sessions. Check your connection.'); } })
      .finally(() => { if (isMounted.current) setLoading(false); });
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const openSession = (id) => {
    try { sessionStorage.setItem(SESSION_STATE_KEY, id); } catch {}
    setActiveId(id);
  };

  const closeSession = () => {
    try { sessionStorage.removeItem(SESSION_STATE_KEY); } catch {}
    // Load sessions first, THEN clear activeId — prevents blank flash
    SessionAPI.list()
      .then(d => { if (isMounted.current) setSessions(d); })
      .catch(() => {})
      .finally(() => { if (isMounted.current) setActiveId(null); });
  };

  // ── Live dashboard view ──
  if (activeId) {
    return (
      <motion.div key="dashboard" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
        <LiveDashboard sessionId={activeId} onBack={closeSession} />
      </motion.div>
    );
  }

  // ── Sessions list ──
  return (
    <motion.div key="list" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="grid gap-6">
      <div>
        <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>Sessions</h2>
        <p className="text-sm" style={{ color: '#8B949E' }}>Click any session to see its live dashboard.</p>
      </div>

      {/* Error state — fallback UI instead of blank */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="glass p-6 flex items-center justify-between gap-4"
          style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <span className="text-sm" style={{ color: '#ef4444' }}>{error}</span>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={loadSessions} className="btn-ghost !py-2 !px-4 text-sm">Retry</motion.button>
        </motion.div>
      )}

      {(!sessions || loading) && !error ? (
        <div className="grid gap-4"><SkeletonCard /><SkeletonCard /></div>
      ) : sessions?.length === 0 ? (
        <div className="glass p-12 text-center" style={{ color: '#4a5060' }}>
          No sessions yet. Create one from the "Create Quiz" tab.
        </div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence initial={false}>
            {sessions?.map((s, i) => (
              <motion.button key={s.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                onClick={() => openSession(s.id)}
                className="glass p-6 text-left w-full">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-lg font-bold tracking-widest gold-text">{s.code}</span>
                      <span className="badge text-[10px]"
                        style={{
                          background: s.status === 'active' ? 'rgba(63,185,80,0.1)' : 'rgba(240,234,214,0.04)',
                          color: s.status === 'active' ? '#3FB950' : '#8B949E',
                          border: `1px solid ${s.status === 'active' ? 'rgba(63,185,80,0.2)' : 'rgba(240,234,214,0.06)'}`,
                        }}>{s.status}</span>
                    </div>
                    <div className="font-display text-xl font-bold truncate" style={{ color: '#F0EAD6' }}>{s.title}</div>
                    <div className="text-sm mt-1" style={{ color: '#8B949E' }}>{s.lecture_name}</div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-sm font-mono" style={{ color: '#F0EAD6' }}>{s.participant_count} <span style={{ color: '#8B949E' }}>joined</span></div>
                    <div className="text-sm font-mono" style={{ color: '#F0EAD6' }}>{s.question_count} <span style={{ color: '#8B949E' }}>Q's</span></div>
                    <div className="text-xs mt-1" style={{ color: '#4a5060' }}>{formatDateTime(s.created_at)}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
