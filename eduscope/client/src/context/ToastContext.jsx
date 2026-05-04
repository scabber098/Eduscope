// === FILE: client/src/context/ToastContext.jsx ===
import { createContext, useCallback, useContext, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);
let tid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const dismiss = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);
  const push = useCallback((t) => {
    const id = ++tid;
    const entry = { id, type: t.type || 'info', title: t.title || '', message: t.message || '', duration: t.duration ?? 3500 };
    setToasts(prev => [...prev, entry]);
    if (entry.duration) setTimeout(() => dismiss(id), entry.duration);
    return id;
  }, [dismiss]);

  const toast = useMemo(() => ({
    success: (m, t = 'Success') => push({ type: 'success', message: m, title: t }),
    error:   (m, t = 'Error')   => push({ type: 'error',   message: m, title: t }),
    info:    (m, t = 'Info')    => push({ type: 'info',    message: m, title: t }),
    warn:    (m, t = 'Warning') => push({ type: 'warn',    message: m, title: t }),
  }), [push]);

  const colors = { success: '#3FB950', error: '#F85149', info: '#F0B429', warn: '#E07B39' };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id} layout
              initial={{ opacity: 0, x: 80, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              onClick={() => dismiss(t.id)}
              className="pointer-events-auto cursor-pointer p-4 rounded-xl border backdrop-blur-xl"
              style={{
                background: 'rgba(22, 27, 34, 0.85)',
                borderColor: `${colors[t.type] || colors.info}40`,
                borderLeftWidth: 4,
                borderLeftColor: colors[t.type] || colors.info,
                minWidth: 300,
              }}
            >
              {t.title && <div className="font-semibold text-sm" style={{ color: '#F0EAD6' }}>{t.title}</div>}
              <div className="text-sm" style={{ color: '#8B949E' }}>{t.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast within ToastProvider');
  return ctx;
}
