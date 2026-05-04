// === FILE: client/src/components/SidePanel.jsx ===
import { AnimatePresence, motion } from 'framer-motion';
export default function SidePanel({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (<>
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onClick={onClose}
          className="fixed inset-0 z-[90]" style={{ background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)' }}/>
        <motion.aside initial={{ x:'100%' }} animate={{ x:0 }} exit={{ x:'100%' }}
          transition={{ type:'spring',stiffness:280,damping:32 }}
          className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] z-[95] flex flex-col border-l"
          style={{ background:'rgba(16,20,28,0.97)', borderColor:'rgba(240,234,214,0.06)', backdropFilter:'blur(20px)' }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor:'rgba(240,234,214,0.06)' }}>
            <h3 className="font-display text-xl" style={{ color:'#F0EAD6' }}>{title}</h3>
            <button onClick={onClose} className="w-9 h-9 rounded-lg border flex items-center justify-center transition-colors hover:border-[#F0B429]"
              style={{ borderColor:'rgba(240,234,214,0.08)', color:'#8B949E' }}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </motion.aside>
      </>)}
    </AnimatePresence>
  );
}
