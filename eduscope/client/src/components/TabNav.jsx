// === FILE: client/src/components/TabNav.jsx ===
import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePollGuard } from '../context/PollGuardContext';

function TabNav({ tabs, activeKey, onChange }) {
  const { attemptLeave } = usePollGuard();
  const click = useCallback((key) => { if (key === activeKey) return; attemptLeave(() => onChange(key)); }, [activeKey, attemptLeave, onChange]);

  return (
    <div className="border-b px-4 md:px-8" style={{ borderColor: 'rgba(240,234,214,0.05)', background: 'rgba(10,13,18,0.6)', backdropFilter: 'blur(12px)' }}>
      <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
        {tabs.map(tab => {
          const active = tab.key === activeKey;
          return (
            <button key={tab.key} onClick={() => click(tab.key)}
              className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${active ? 'text-[#F0B429]' : 'text-[#8B949E] hover:text-[#F0EAD6]'}`}>
              <span className="flex items-center gap-2">{tab.icon}{tab.label}</span>
              {active && <motion.div layoutId="tab-line" className="absolute left-3 right-3 -bottom-px h-[2px] gold-gradient rounded-full"
                transition={{ type:'spring',stiffness:380,damping:30 }}/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default memo(TabNav);
