// === FILE: client/src/context/PollGuardContext.jsx ===
import { createContext, useCallback, useContext, useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const PollGuardContext = createContext(null);

export function PollGuardProvider({ children }) {
  const [isInsidePoll, setInsidePoll] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const isInsideRef = useRef(false);
  useEffect(() => { isInsideRef.current = isInsidePoll; }, [isInsidePoll]);

  const attemptLeave = useCallback((action) => {
    if (isInsideRef.current) { setPendingAction(() => action); return false; }
    action(); return true;
  }, []);

  const confirmLeave = useCallback(() => {
    setInsidePoll(false); isInsideRef.current = false;
    const a = pendingAction; setPendingAction(null); if (a) a();
  }, [pendingAction]);

  const cancelLeave = useCallback(() => setPendingAction(null), []);

  useEffect(() => {
    const h = (e) => { if (isInsideRef.current) { e.preventDefault(); e.returnValue = ''; return ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (isInsideRef.current) {
        window.history.pushState(null, '', window.location.href);
        setPendingAction(() => () => window.history.go(-1));
      }
    };
    if (isInsidePoll) { window.history.pushState(null, '', window.location.href); window.addEventListener('popstate', onPop); }
    return () => window.removeEventListener('popstate', onPop);
  }, [isInsidePoll]);

  const value = useMemo(() => ({ isInsidePoll, setInsidePoll, attemptLeave }), [isInsidePoll, attemptLeave]);

  return (
    <PollGuardContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {pendingAction && (
          <motion.div key="guard-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
            <motion.div key="guard-m"
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="max-w-md w-full p-8 rounded-2xl border text-center"
              style={{ background: 'rgba(22, 27, 34, 0.95)', borderColor: 'rgba(248, 81, 73, 0.3)', backdropFilter: 'blur(20px)' }}>
              <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: 'rgba(248,81,73,0.15)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M12 9v4M12 17h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" stroke="#F85149" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h2 className="font-display text-2xl" style={{ color: '#F0EAD6' }}>Leave Poll?</h2>
              <p className="mt-2 mb-6 leading-relaxed" style={{ color: '#8B949E' }}>You are currently in an active poll. Leaving will forfeit your current answers.</p>
              <div className="flex gap-3">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={cancelLeave}
                  className="flex-1 py-3 rounded-xl font-semibold" style={{ background: 'linear-gradient(135deg, #F0B429, #E07B39)', color: '#0D1117' }}>Stay in Poll</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={confirmLeave}
                  className="flex-1 py-3 rounded-xl font-semibold" style={{ background: '#F85149', color: '#fff' }}>Leave Anyway</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PollGuardContext.Provider>
  );
}

export function usePollGuard() { const c = useContext(PollGuardContext); if (!c) throw new Error('usePollGuard within PollGuardProvider'); return c; }
export function useTabGuard(active) {
  const { setInsidePoll } = usePollGuard();
  useEffect(() => { setInsidePoll(!!active); return () => setInsidePoll(false); }, [active, setInsidePoll]);
}
