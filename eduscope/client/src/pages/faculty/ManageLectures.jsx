// === FILE: client/src/pages/faculty/ManageLectures.jsx ===
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LectureAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { SkeletonRow } from '../../components/Skeleton';
import { formatDate } from '../../utils/format';

export default function ManageLectures() {
  const [lectures, setLectures] = useState(null);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const toast = useToast();
  useEffect(() => { LectureAPI.list().then(setLectures).catch(() => setLectures([])); }, []);

  const create = async (e) => {
    e.preventDefault(); if (!name.trim()||creating) return; setCreating(true);
    try { const l = await LectureAPI.create(name.trim()); setLectures(p => [l,...(p||[])]); setName(''); toast.success('Lecture created'); }
    catch(err) { toast.error(err.response?.data?.error||'Try again'); }
    finally { setCreating(false); }
  };
  const remove = async (l) => {
    if (!confirm(`Archive "${l.name}"?`)) return;
    try { await LectureAPI.remove(l.id); setLectures(p => p.filter(x => x.id!==l.id)); toast.info('Archived'); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="grid gap-6">
      <div><h2 className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>Manage Lectures</h2><p className="text-sm" style={{ color:'#8B949E' }}>Create, review, and archive.</p></div>
      <motion.form onSubmit={create} initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} className="glass p-5 flex flex-col md:flex-row gap-3">
        <input className="input-field flex-1" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Quantum Mechanics — Lecture 12"/>
        <motion.button type="submit" whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} className="btn-primary whitespace-nowrap" disabled={creating}>{creating?'Creating…':'+ Create'}</motion.button>
      </motion.form>
      {!lectures ? <div className="glass p-5">{Array.from({length:3}).map((_,i)=><SkeletonRow key={i}/>)}</div>
       : lectures.length===0 ? <div className="glass p-12 text-center" style={{ color:'#4a5060' }}>No lectures yet.</div>
       : <div className="glass overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider border-b" style={{ color:'#8B949E',borderColor:'rgba(240,234,214,0.04)' }}>
            <div className="col-span-5">Lecture</div><div className="col-span-2">Created</div><div className="col-span-2">Polls</div><div className="col-span-2">Participation</div><div className="col-span-1 text-right">Actions</div>
          </div>
          <AnimatePresence initial={false}>{lectures.map((l,i) => (
            <motion.div key={l.id} layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,x:-40 }}
              transition={{ delay:i*0.03 }} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 border-b last:border-0 hover:bg-[rgba(240,180,41,0.02)] transition-colors"
              style={{ borderColor:'rgba(240,234,214,0.03)' }}>
              <div className="md:col-span-5 font-medium" style={{ color:'#F0EAD6' }}>{l.name}</div>
              <div className="md:col-span-2 text-sm" style={{ color:'#8B949E' }}>{formatDate(l.created_at)}</div>
              <div className="md:col-span-2 text-sm" style={{ color:'#8B949E' }}>{l.poll_count} polls</div>
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(240,234,214,0.04)' }}>
                  <div className="h-full rounded-full" style={{ width:`${l.participation_rate}%`,background:l.participation_rate>=75?'#3FB950':l.participation_rate>=50?'#F0B429':'#E07B39' }}/>
                </div>
                <span className="text-xs font-mono w-10 text-right" style={{ color:'#8B949E' }}>{l.participation_rate}%</span>
              </div>
              <div className="md:col-span-1 flex justify-end">
                <button onClick={() => remove(l)} className="text-xs transition-colors hover:text-[#F85149]" style={{ color:'#8B949E' }}>Archive</button>
              </div>
            </motion.div>
          ))}</AnimatePresence>
        </div>}
    </div>
  );
}
