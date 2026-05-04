// === FILE: client/src/pages/faculty/ScheduledSessions.jsx ===
// NEW — Frontend UI for scheduled sessions (backend already existed).
// Faculty can create, view, and delete scheduled quiz sessions.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduledSessionAPI, LectureAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { SkeletonCard } from '../../components/Skeleton';

const GOLD = '#F0B429';

function StatusBadge({ status, scheduled_at }) {
  const now = Date.now();
  const isPast = scheduled_at < now;
  const label = status === 'active' ? 'Active' : isPast ? 'Ended' : 'Scheduled';
  const color = status === 'active' ? '#3FB950' : isPast ? '#8B949E' : GOLD;
  return (
    <span style={{ fontSize:11, padding:'2px 10px', borderRadius:20, border:`1px solid ${color}40`, color, background:`${color}10` }}>
      {label}
    </span>
  );
}

function formatDT(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString(undefined, { dateStyle:'medium', timeStyle:'short' });
}

export default function ScheduledSessions() {
  const toast = useToast();
  const [sessions, setSessions] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', lecture_id: '', scheduled_at: '', duration_minutes: 30, max_attempts: 1,
    questions: [{ question:'', options:['','','',''], correct_index: 0 }]
  });

  const load = () => {
    ScheduledSessionAPI.list()
      .then(d => setSessions(Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : [])))
      .catch(() => setSessions([]));
  };

  useEffect(() => {
    load();
    LectureAPI.list().then(setLectures).catch(()=>{});
  }, []);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setQ = (i, k, v) => setForm(f => {
    const qs = [...f.questions]; qs[i] = { ...qs[i], [k]: v }; return { ...f, questions: qs };
  });
  const setOpt = (qi, oi, v) => setForm(f => {
    const qs = [...f.questions];
    const opts = [...qs[qi].options]; opts[oi] = v; qs[qi] = { ...qs[qi], options: opts };
    return { ...f, questions: qs };
  });
  const addQ = () => setForm(f => ({ ...f, questions: [...f.questions, { question:'', options:['','','',''], correct_index:0 }] }));
  const removeQ = (i) => setForm(f => ({ ...f, questions: f.questions.filter((_,j)=>j!==i) }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.scheduled_at || !form.duration_minutes) {
      return toast.error('Title, date/time, and duration are required.');
    }
    const validQs = form.questions.filter(q => q.question.trim() && q.options.filter(o=>o.trim()).length >= 2);
    if (!validQs.length) return toast.error('Add at least one question with 2+ options.');

    setSaving(true);
    try {
      await ScheduledSessionAPI.create({
        title: form.title.trim(),
        lecture_id: form.lecture_id || undefined,
        scheduled_at: new Date(form.scheduled_at).getTime(),
        duration_minutes: Number(form.duration_minutes),
        max_attempts: Number(form.max_attempts),
        questions: validQs.map(q => ({
          question: q.question.trim(),
          options: q.options.map(o=>o.trim()).filter(Boolean),
          correct_index: Number(q.correct_index),
          tags: [],
        })),
      });
      toast.showToast('Session scheduled!', 'success');
      setShowForm(false);
      setForm({ title:'', lecture_id:'', scheduled_at:'', duration_minutes:30, max_attempts:1,
        questions:[{ question:'', options:['','','',''], correct_index:0 }] });
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to schedule.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this scheduled session?')) return;
    try { await ScheduledSessionAPI.remove(id); load(); toast.showToast('Deleted','success'); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="grid gap-6">
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>Scheduled Sessions</h2>
          <p style={{ color:'#8B949E', fontSize:14 }}>Create timed quiz sessions students can access by code.</p>
        </div>
        <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          onClick={() => setShowForm(s => !s)} className="btn-primary">
          {showForm ? '✕ Cancel' : '+ Schedule Session'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div key="form" initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
            className="glass p-6 grid gap-5">
            <h3 className="font-display text-xl" style={{ color:'#F0EAD6' }}>New Scheduled Session</h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={{ fontSize:11, color:'rgba(240,234,214,0.5)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Title</label>
                <input className="input-field" value={form.title} onChange={e=>setF('title',e.target.value)} placeholder="Midterm Quiz"/>
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(240,234,214,0.5)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Lecture (optional)</label>
                <select className="input-field" value={form.lecture_id} onChange={e=>setF('lecture_id',e.target.value)}>
                  <option value="">— None —</option>
                  {lectures.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, color:'rgba(240,234,214,0.5)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Scheduled date & time</label>
                <input type="datetime-local" className="input-field" value={form.scheduled_at} onChange={e=>setF('scheduled_at',e.target.value)}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div>
                  <label style={{ fontSize:11, color:'rgba(240,234,214,0.5)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Duration (min)</label>
                  <input type="number" className="input-field" value={form.duration_minutes} min={5} max={180} onChange={e=>setF('duration_minutes',e.target.value)}/>
                </div>
                <div>
                  <label style={{ fontSize:11, color:'rgba(240,234,214,0.5)', display:'block', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.07em' }}>Max attempts</label>
                  <input type="number" className="input-field" value={form.max_attempts} min={1} max={5} onChange={e=>setF('max_attempts',e.target.value)}/>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-display text-base" style={{ color:'#F0EAD6', marginBottom:12 }}>Questions</h4>
              <div className="grid gap-4">
                {form.questions.map((q, qi) => (
                  <div key={qi} className="glass p-4" style={{ borderColor:'rgba(240,180,41,0.1)' }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:8 }}>
                      <span style={{ fontSize:12, color:GOLD, fontWeight:700 }}>Q{qi+1}</span>
                      <input className="input-field !py-1.5" style={{ flex:1 }} value={q.question}
                        onChange={e=>setQ(qi,'question',e.target.value)} placeholder="Question text"/>
                      {form.questions.length > 1 && (
                        <button onClick={()=>removeQ(qi)} style={{ color:'#F85149', fontSize:18, background:'none', border:'none', cursor:'pointer', flexShrink:0 }}>✕</button>
                      )}
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <input type="radio" name={`correct-${qi}`} checked={q.correct_index===oi}
                            onChange={()=>setQ(qi,'correct_index',oi)}
                            style={{ accentColor:GOLD, flexShrink:0 }}/>
                          <input className="input-field !py-1.5" value={opt}
                            onChange={e=>setOpt(qi,oi,e.target.value)} placeholder={`Option ${oi+1}`}/>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize:11, color:'rgba(240,234,214,0.3)', marginTop:6 }}>Radio = correct answer</div>
                  </div>
                ))}
              </div>
              <button onClick={addQ} style={{ marginTop:10, fontSize:13, color:GOLD, background:'none', border:`1px dashed ${GOLD}40`, borderRadius:10, padding:'6px 16px', cursor:'pointer', width:'100%' }}>
                + Add Question
              </button>
            </div>

            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center">
              {saving ? 'Scheduling…' : '⚡ Schedule Session'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {!sessions && <SkeletonCard/>}
      {sessions?.length === 0 && (
        <div className="glass p-12 text-center" style={{ color:'rgba(240,234,214,0.3)' }}>
          No scheduled sessions yet. Create one above.
        </div>
      )}
      {sessions?.length > 0 && (
        <div className="glass overflow-hidden">
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr auto', gap:12, padding:'10px 20px',
            fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em',
            borderBottom:'1px solid rgba(240,234,214,0.04)' }}>
            <div>Title</div><div>Scheduled</div><div>Duration</div><div>Status</div><div></div>
          </div>
          {sessions.map((s, i) => (
            <motion.div key={s._id||s.id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              style={{ display:'grid', gridTemplateColumns:'2fr 1.2fr 1fr 1fr auto', gap:12, padding:'14px 20px', alignItems:'center',
                borderBottom:'1px solid rgba(240,234,214,0.03)' }}>
              <div>
                <div style={{ color:'#F0EAD6', fontWeight:600, fontSize:14 }}>{s.title}</div>
                <div style={{ fontSize:11, color:'rgba(240,234,214,0.3)', marginTop:2 }}>
                  Code: <span style={{ color:GOLD, fontFamily:'monospace' }}>{s.access_code}</span>
                  {' · '}{s.questions?.length||0} questions
                </div>
              </div>
              <div style={{ fontSize:13, color:'rgba(240,234,214,0.6)' }}>{formatDT(s.scheduled_at)}</div>
              <div style={{ fontSize:13, color:'rgba(240,234,214,0.6)' }}>{s.duration_minutes} min</div>
              <div><StatusBadge status={s.status} scheduled_at={s.scheduled_at}/></div>
              <button onClick={()=>handleDelete(s._id||s.id)}
                style={{ color:'#F85149', fontSize:18, background:'none', border:'none', cursor:'pointer', padding:'4px 8px' }}>✕</button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
