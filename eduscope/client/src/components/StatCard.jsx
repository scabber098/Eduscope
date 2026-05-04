// === FILE: client/src/components/StatCard.jsx ===
import { memo } from 'react';
import { motion } from 'framer-motion';
import { useCountUp } from '../hooks/useCountUp';

function StatCard({ label, value, suffix = '', icon, accent = '#F0B429', delay = 0 }) {
  const display = useCountUp(Number(value) || 0);
  return (
    <motion.div initial={{ opacity:0,y:18 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.5,delay }}
      whileHover={{ y:-6, transition: { duration: 0.3 } }} className="glass p-6">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs uppercase tracking-widest" style={{ color: '#8B949E' }}>{label}</span>
        {icon && <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${accent}12`, color: accent }}>{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="font-display text-4xl font-bold" style={{ color: accent }}>{display}</span>
        {suffix && <span className="text-xl" style={{ color: '#8B949E' }}>{suffix}</span>}
      </div>
    </motion.div>
  );
}
export default memo(StatCard);
