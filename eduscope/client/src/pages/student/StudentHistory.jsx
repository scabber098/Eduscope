// === FILE: client/src/pages/student/StudentHistory.jsx ===
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ResponseAPI } from '../../api/client';
import { SkeletonRow } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate } from '../../utils/format';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Build per-session accuracy data from history
function buildTrend(history) {
  const map = {};
  history.forEach(h => {
    const key = h.lecture_name || 'Unknown';
    if (!map[key]) map[key] = { label: key.slice(0,16), total:0, correct:0 };
    if (h.correct !== null) {
      map[key].total++;
      if (h.correct) map[key].correct++;
    }
  });
  return Object.values(map).map(s => ({
    label: s.label,
    accuracy: s.total ? Math.round((s.correct/s.total)*100) : null,
  })).filter(s => s.accuracy !== null);
}

export default function StudentHistory() {
  const [history, setHistory] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const d = useDebounce(query, 250);
  useEffect(() => { ResponseAPI.me().then(setHistory).catch(()=>setHistory([])); }, []);
  const lectures = useMemo(() => history ? Array.from(new Set(history.map(h=>h.lecture_name))).sort() : [], [history]);
  const filtered = useMemo(() => {
    if (!history) return [];
    const q = d.trim().toLowerCase();
    return history.filter(h => { if(filter!=='all'&&h.lecture_name!==filter) return false; if(q&&!h.question.toLowerCase().includes(q)&&!h.lecture_name.toLowerCase().includes(q)) return false; return true; });
  }, [history,filter,d]);

  if (!history) return <div className="glass p-6">{Array.from({length:5}).map((_,i)=><SkeletonRow key={i}/>)}</div>;

  const trend = buildTrend(history);
  const totalAnswered = history.length;
  const correct = history.filter(h=>h.correct===true).length;
  const overall = totalAnswered ? Math.round((correct/history.filter(h=>h.correct!==null).length)*100) : null;

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div><h2 className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>My History</h2></div>
        <div className="flex gap-3 flex-wrap">
          <input className="input-field !py-2 !w-auto md:min-w-[240px]" placeholder="Search…" value={query} onChange={e=>setQuery(e.target.value)}/>
          <select className="input-field !py-2 !w-auto" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All lectures</option>{lectures.map(l=><option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>
      {/* Accuracy trend chart */}
      {trend.length >= 2 && (
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="glass p-5" style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <h3 className="font-display text-lg" style={{ color:'#F0EAD6' }}>Accuracy trend</h3>
            {overall !== null && (
              <span style={{ fontSize:13, color: overall>=75?'#3FB950':overall>=50?'#F0B429':'#F85149', fontWeight:600 }}>
                Overall: {overall}%
              </span>
            )}
          </div>
          <div style={{ height:160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top:4, right:12, left:-24, bottom:4 }}>
                <CartesianGrid stroke="rgba(240,234,214,0.04)" vertical={false}/>
                <XAxis dataKey="label" stroke="#8B949E" tick={{ fontSize:10 }} interval={0} angle={-10} textAnchor="end" height={40}/>
                <YAxis stroke="#8B949E" tick={{ fontSize:11 }} domain={[0,100]}/>
                <Tooltip
                  contentStyle={{ background:'rgba(22,27,34,0.95)', border:'1px solid rgba(240,234,214,0.06)', borderRadius:10, color:'#F0EAD6' }}
                  formatter={v=>[`${v}%`, 'Accuracy']}/>
                <Line type="monotone" dataKey="accuracy" stroke="#F0B429" strokeWidth={2} dot={{ r:4, fill:'#F0B429' }} activeDot={{ r:6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {filtered.length===0?<div className="glass p-12 text-center" style={{ color:'#4a5060' }}>No responses match.</div>:(
        <div className="glass overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider border-b" style={{ color:'#8B949E',borderColor:'rgba(240,234,214,0.04)' }}>
            <div className="col-span-3">Lecture</div><div className="col-span-4">Question</div><div className="col-span-2">Your answer</div><div className="col-span-2">Correct</div><div className="col-span-1 text-right">Date</div>
          </div>
          {filtered.map((r,i) => (
            <motion.div key={r.response_id} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.03 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 border-b last:border-0 transition-colors hover:bg-[rgba(240,180,41,0.02)]"
              style={{ borderColor:'rgba(240,234,214,0.03)' }}>
              <div className="md:col-span-3 font-medium" style={{ color:'#F0EAD6' }}>{r.lecture_name}</div>
              <div className="md:col-span-4 text-sm" style={{ color:'#8B949E' }}>{r.question}</div>
              <div className="md:col-span-2 text-sm" style={{ color:r.correct===true?'#3FB950':r.correct===false?'#F85149':'#F0EAD6' }}>
                {r.options[r.answer_index]}{r.correct===true?' ✓':r.correct===false?' ✕':''}
              </div>
              <div className="md:col-span-2 text-sm" style={{ color:'#8B949E' }}>{r.correct_index!=null?r.options[r.correct_index]:'—'}</div>
              <div className="md:col-span-1 text-right text-xs" style={{ color:'#4a5060' }}>{formatDate(r.created_at)}</div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
