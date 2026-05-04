// === FILE: client/src/components/Logo.jsx ===
import { motion } from 'framer-motion';

export default function Logo({ size = 72, animated = true }) {
  const C = animated ? motion.div : 'div';
  return (
    <C
      style={{ width: size, height: size }}
      className="rounded-xl gold-gradient flex items-center justify-center flex-shrink-0"
      whileHover={animated ? { scale: 1.06, rotate: 3 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <path d="M12 3L1 9l11 6 11-6-11-6z" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M1 15l11 6 11-6" stroke="#060810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
      </svg>
    </C>
  );
}
