// === FILE: client/src/pages/faculty/Reports.jsx ===
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import { LectureAPI, ReportAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { SkeletonCard } from '../../components/Skeleton';

function exportCSV(report) {
  if (!report) return;
  const rows = [['Question','Options','Correct Answer','Total Responses','Participation %','Correct %','Struggled']];
  report.polls.forEach(p => {
    rows.push([
      `"${p.question.replace(/"/g,'""')}"`,
      `"${p.options.join(' | ')}"`,
      p.correct_index != null ? `"${p.options[p.correct_index]}"` : 'N/A',
      p.total_responses,
      p.participation_rate,
      p.correct_rate ?? 'N/A',
      p.struggled ? 'Yes' : 'No',
    ]);
  });
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `${report.lecture.name.replace(/\s+/g,'_')}_report.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [lectures, setLectures] = useState([]);
  const [lectureId, setLectureId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => { LectureAPI.list().then(ls => { setLectures(ls); if(ls[0]) setLectureId(ls[0].id); }); }, []);

  const gen = async () => {
    if(!lectureId||loading) return; setLoading(true); setReport(null);
    await new Promise(r => setTimeout(r,400));
    try { setReport(await ReportAPI.lectureReport(lectureId)); } catch { toast.error('Failed'); } finally { setLoading(false); }
  };
  useEffect(() => { if(lectureId) gen(); }, [lectureId]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col md:flex-row gap-3 md:items-end justify-between">
        <div><h2 className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>Reports</h2><p className="text-sm" style={{ color:'#8B949E' }}>Per-lecture engagement breakdown.</p></div>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>
          <select className="input-field !py-2 md:w-72" value={lectureId} onChange={e => setLectureId(e.target.value)}>
            {lectures.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          {report && (
            <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
              onClick={() => exportCSV(report)}
              className="btn-ghost !py-2 !px-4 text-sm" style={{ flexShrink:0 }}>
              ⬇ Export CSV
            </motion.button>
          )}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {loading ? <motion.div key="l" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="grid gap-5"><div className="grid md:grid-cols-3 gap-5"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div><SkeletonCard/></motion.div>
        : report ? <motion.div key={report.lecture.id} initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }} className="grid gap-6">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="glass p-6"><div className="text-xs uppercase tracking-widest mb-2" style={{ color:'#8B949E' }}>Lecture</div><div className="font-display text-xl" style={{ color:'#F0EAD6' }}>{report.lecture.name}</div></div>
            <div className="glass p-6"><div className="text-xs uppercase tracking-widest mb-2" style={{ color:'#8B949E' }}>Avg participation</div><div className="font-display text-4xl font-bold gold-text">{report.avg_participation}%</div></div>
            <div className="glass p-6"><div className="text-xs uppercase tracking-widest mb-2" style={{ color:'#8B949E' }}>Polls</div><div className="font-display text-4xl font-bold" style={{ color:'#F0EAD6' }}>{report.total_polls}</div></div>
          </div>
          {report.polls.length > 0 && <div className="glass p-6">
            <h3 className="font-display text-xl mb-4" style={{ color:'#F0EAD6' }}>Per-poll results</h3>
            <div className="h-72"><ResponsiveContainer>
              <BarChart data={report.polls.map((p,i)=>({ name:`Q${i+1}`,participation:p.participation_rate,correct:p.correct_rate,struggled:p.struggled }))}>
                <CartesianGrid stroke="rgba(240,234,214,0.04)" vertical={false}/><XAxis dataKey="name" stroke="#8B949E" tick={{ fontSize:11 }}/><YAxis stroke="#8B949E" tick={{ fontSize:11 }} domain={[0,100]}/>
                <Tooltip contentStyle={{ background:'rgba(22,27,34,0.95)',border:'1px solid rgba(240,234,214,0.06)',borderRadius:12,color:'#F0EAD6' }}/>
                <Legend wrapperStyle={{ color:'#8B949E',fontSize:12 }}/>
                <Bar dataKey="participation" name="Participation %" fill="#F0B429" radius={[6,6,0,0]} isAnimationActive animationDuration={1100}/>
                <Bar dataKey="correct" name="Correct %" radius={[6,6,0,0]} isAnimationActive animationDuration={1100}>
                  {report.polls.map((p,i) => <Cell key={i} fill={p.struggled?'#F85149':'#3FB950'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer></div>
          </div>}
          {report.polls.map((p,i) => (
            <motion.div key={p.id} initial={{ opacity:0,y:12 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1+i*0.06 }}
              className={`glass p-5 ${p.struggled?'':''}` } style={p.struggled?{ borderLeftWidth:4,borderLeftColor:'#F85149' }:{}}>
              <div className="flex justify-between gap-4 mb-3"><div><div className="text-xs uppercase tracking-wider mb-1" style={{ color:'#8B949E' }}>Question {i+1}</div><div className="font-display text-lg" style={{ color:'#F0EAD6' }}>{p.question}</div></div>
                <div className="text-right flex-shrink-0"><div className="text-2xl font-display font-bold" style={{ color:'#F0EAD6' }}>{p.participation_rate}%</div>{p.correct_index!=null&&<div className="text-xs" style={{ color:p.struggled?'#F85149':'#3FB950' }}>{p.correct_rate}% correct</div>}</div></div>
              <div className="space-y-1.5">{p.options.map((o,oi)=>{ const c=p.option_counts[oi]||0;const pct=p.total_responses>0?Math.round(c/p.total_responses*100):0;const ok=p.correct_index===oi;
                return <div key={oi} className="flex items-center gap-3"><div className="w-6 text-xs font-bold" style={{ color:ok?'#3FB950':'#8B949E' }}>{String.fromCharCode(65+oi)}</div>
                  <div className="flex-1 text-sm" style={{ color:ok?'#3FB950':'#F0EAD6' }}>{o}</div>
                  <div className="flex-1 max-w-xs h-2 rounded-full overflow-hidden" style={{ background:'rgba(240,234,214,0.04)' }}><motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.9 }} className="h-full rounded-full" style={{ background:ok?'#3FB950':'#F0B429' }}/></div>
                  <div className="w-14 text-right text-xs font-mono" style={{ color:'#8B949E' }}>{c}·{pct}%</div></div>
              })}</div>
            </motion.div>
          ))}
        </motion.div> : null}
      </AnimatePresence>
    </div>
  );
}
