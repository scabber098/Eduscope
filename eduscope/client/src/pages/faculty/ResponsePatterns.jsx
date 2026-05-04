// === FILE: client/src/pages/faculty/ResponsePatterns.jsx ===
// NEW — Response pattern analysis. Shows option distribution heatmap,
// drop-off timeline, and struggled question breakdown per session.
// Does NOT modify any existing file.
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionAPI } from '../../api/client';
import { SkeletonCard } from '../../components/Skeleton';
import { formatDateTime } from '../../utils/format';

const GOLD = '#F0B429';
const RED  = '#F85149';
const GRN  = '#3FB950';
const MUT  = 'rgba(240,234,214,0.06)';

function OptionBar({ label, count, total, isCorrect }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'rgba(240,234,214,0.6)', marginBottom:3 }}>
        <span style={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
        <span style={{ color: isCorrect ? GRN : 'rgba(240,234,214,0.5)', fontWeight: isCorrect?700:400 }}>{pct}% ({count})</span>
      </div>
      <div style={{ height:8, background:'rgba(240,234,214,0.06)', borderRadius:4, overflow:'hidden' }}>
        <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8 }}
          style={{ height:'100%', borderRadius:4, background: isCorrect ? GRN : pct > 50 ? GOLD : 'rgba(240,234,214,0.2)' }}/>
      </div>
    </div>
  );
}

function PollCard({ poll, idx }) {
  const total = poll.total_responses;
  const letters = ['A','B','C','D','E','F'];
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.05 }}
      className="glass p-5" style={{ borderLeft: poll.struggled ? `3px solid ${RED}` : '3px solid transparent' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>
            Q{idx+1} {poll.tags?.length ? `· ${poll.tags.join(', ')}` : ''}
          </div>
          <div style={{ color:'#F0EAD6', fontSize:14, lineHeight:1.5 }}>{poll.question}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0, marginLeft:16 }}>
          <div style={{ fontSize:22, fontWeight:700, color:'#F0EAD6', fontFamily:'var(--font-display)' }}>{total}</div>
          <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)' }}>responses</div>
          {poll.accuracy != null && (
            <div style={{ fontSize:12, marginTop:4, color: poll.struggled ? RED : GRN, fontWeight:600 }}>
              {poll.accuracy}% correct
            </div>
          )}
        </div>
      </div>
      {poll.options.map((opt, i) => (
        <OptionBar key={i} label={`${letters[i]}) ${opt}`} count={poll.distribution[i]||0}
          total={total} isCorrect={poll.correct_index === i}/>
      ))}
      {poll.struggled && (
        <div style={{ marginTop:10, fontSize:12, color:RED, background:'rgba(248,81,73,0.06)', border:'1px solid rgba(248,81,73,0.15)', borderRadius:8, padding:'6px 10px' }}>
          ⚠ Struggled topic — less than 60% correct
        </div>
      )}
    </motion.div>
  );
}

function TimelineChart({ timeline }) {
  if (!timeline?.length) return null;
  const max = Math.max(...timeline.map(t => t.count), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:48, marginTop:8 }}>
      {timeline.map((t, i) => (
        <div key={i} title={`${t.t}s: ${t.count} responses`}
          style={{ flex:1, background: GOLD, opacity:0.15 + (t.count/max)*0.75,
            height:`${Math.max(4,(t.count/max)*48)}px`, borderRadius:'2px 2px 0 0', minWidth:3 }}/>
      ))}
    </div>
  );
}

export default function ResponsePatterns() {
  const [sessions, setSessions] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    SessionAPI.list().then(d => {
      setSessions(d);
      if (d[0]) setSessionId(d[0].id);
    }).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true); setReport(null);
    fetch(`${(import.meta.env.VITE_API_URL||'')}/api/analytics/session/${sessionId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('pollcast_token')||''}` }
    }).then(r => r.json()).then(d => setReport(d)).catch(() => setReport(null)).finally(() => setLoading(false));
  }, [sessionId]);

  const struggled = report?.polls?.filter(p => p.struggled) || [];

  return (
    <div className="grid gap-6">
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        <h2 className="font-display text-3xl font-bold" style={{ color:'#F0EAD6' }}>Response Patterns</h2>
        <p style={{ color:'#8B949E', fontSize:14 }}>Option distribution and drop-off analysis per session.</p>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <select className="input-field !py-2" style={{ maxWidth:360 }}
          value={sessionId} onChange={e => setSessionId(e.target.value)}>
          {!sessions && <option>Loading…</option>}
          {sessions?.length === 0 && <option>No sessions yet</option>}
          {sessions?.map(s => <option key={s.id} value={s.id}>{s.title} — {formatDateTime?.(s.created_at)||s.created_at}</option>)}
        </select>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="load" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="grid gap-4">
            <SkeletonCard/><SkeletonCard/>
          </motion.div>
        )}

        {!loading && report && (
          <motion.div key={sessionId} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} className="grid gap-6">
            {/* Summary strip */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12 }}>
              {[
                { label:'Total polls', val: report.polls?.length || 0, color:'#F0EAD6' },
                { label:'Total responses', val: report.polls?.reduce((s,p)=>s+p.total_responses,0)||0, color: GOLD },
                { label:'Struggled topics', val: struggled.length, color: struggled.length ? RED : GRN },
                { label:'Avg accuracy', val: (() => { const sc = report.polls?.filter(p=>p.accuracy!=null); return sc?.length ? Math.round(sc.reduce((s,p)=>s+p.accuracy,0)/sc.length)+'%' : 'N/A'; })(), color: GRN },
              ].map(s => (
                <div key={s.label} className="glass p-4">
                  <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>{s.label}</div>
                  <div style={{ fontSize:26, fontWeight:700, color:s.color, fontFamily:'var(--font-display)' }}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* Response timeline per poll */}
            {report.polls?.some(p => p.timeline?.length > 0) && (
              <div className="glass p-5">
                <h3 className="font-display text-lg" style={{ color:'#F0EAD6', marginBottom:16 }}>Response timing — when students answered</h3>
                <div style={{ display:'grid', gap:16 }}>
                  {report.polls?.filter(p=>p.timeline?.length>0).map((p,i) => (
                    <div key={p.poll_id}>
                      <div style={{ fontSize:12, color:'rgba(240,234,214,0.5)', marginBottom:4 }}>Q{i+1}: {p.question.slice(0,60)}{p.question.length>60?'…':''}</div>
                      <TimelineChart timeline={p.timeline}/>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'rgba(240,234,214,0.3)', marginTop:4 }}>
                        <span>0s</span><span>end</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Per-question option distribution */}
            <h3 className="font-display text-xl" style={{ color:'#F0EAD6' }}>Per-question breakdown</h3>
            {report.polls?.length === 0 && (
              <div className="glass p-12 text-center" style={{ color:'rgba(240,234,214,0.3)' }}>No polls in this session yet.</div>
            )}
            <div style={{ display:'grid', gap:12 }}>
              {report.polls?.map((p, i) => <PollCard key={p.poll_id} poll={p} idx={i}/>)}
            </div>
          </motion.div>
        )}

        {!loading && !report && sessionId && (
          <motion.div key="empty" className="glass p-12 text-center" style={{ color:'rgba(240,234,214,0.3)' }}>
            No data for this session.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
