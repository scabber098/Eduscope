// === FILE: client/src/components/Navbar.jsx ===
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { usePollGuard } from '../context/PollGuardContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { attemptLeave } = usePollGuard();
  const doLogout = () => attemptLeave(() => { logout(); nav('/', { replace: true }); });
  const isFaculty = user?.role === 'faculty';

  return (
    <motion.div
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-30 glass-panel border-b px-4 md:px-8"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Logo size={36} animated={false} />
          <div>
            <div className="font-display text-lg font-bold" style={{ color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              EduScope
            </div>
            <div className="text-[9px] uppercase tracking-[0.2em] font-mono" style={{ color: '#475569' }}>
              {isFaculty ? 'Faculty Console' : 'Student Hub'}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className={`badge hidden md:flex ${isFaculty ? 'badge-gold' : 'badge-blue'}`}>
            {isFaculty ? '🎓 Faculty' : '📚 Student'}
          </span>

          {/* User info */}
          <div className="hidden md:flex flex-col items-end">
            <div className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>{user?.name}</div>
            <div className="text-xs font-mono" style={{ color: '#475569' }}>{user?.email}</div>
          </div>

          {/* Avatar */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center font-bold text-sm cursor-pointer"
            style={{ color: '#060810' }}
          >
            {user?.name?.[0]?.toUpperCase() || '?'}
          </motion.div>

          {/* Logout */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={doLogout}
            className="btn-ghost !py-2 !px-3 text-sm"
          >
            Sign out
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
