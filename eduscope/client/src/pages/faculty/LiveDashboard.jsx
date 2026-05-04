// === FILE: client/src/pages/faculty/LiveDashboard.jsx ===
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionAPI } from '../../api/client';
import { AIInsightAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useSessionRoom, useSocketEvents, emitSocket } from '../../hooks/useSocket';
import { useCountUp } from '../../hooks/useCountUp';
import { SkeletonCard } from '../../components/Skeleton';
import { timeAgo } from '../../utils/format';

// ─── Animated stat tile ──────────────────────────────────────────────────────
function StatTile({ label, value, color, icon, glow }) {
  const n = useCountUp(value);
  return (
    <motion.div whileHover={{ y:-3 }} className="glass-card p-5 text-center relative overflow-hidden"
      style={{ borderColor: glow ? `rgba(${colorRGB(color)},0.3)` : undefined,
               boxShadow:    glow ? `0 0 40px -12px rgba(${colorRGB(color)},0.25)` : undefined }}>
      <div className="text-xs font-mono uppercase tracking-[0.18em] mb-2" style={{ color:'#475569' }}>{label}</div>
      <div className="font-display text-4xl font-bold" style={{ color }}>{icon ? icon : n}</div>
      {icon && <div className="font-display text-4xl font-bold mt-1" style={{ color }}>{n}</div>}
    </motion.div>
  );
}
function colorRGB(c) {
  const map = { '#22c55e':'34,197,94', '#ef4444':'239,68,68', '#f97316':'249,115,22', '#F0B429':'240,180,41', '#f1f5f9':'241,245,249' };
  return map[c] || '255,255,255';
}

// ─── Question card ───────────────────────────────────────────────────────────
function QuestionCard({ poll, index }) {
  const opts  = poll.options;
  const total = poll.total_responses;
  return (
    <motion.div
      initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.07 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background:'rgba(240,180,41,0.12)', color:'#F0B429' }}>
          Q{index+1}
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-snug" style={{ color:'#f1f5f9' }}>{poll.question}</p>
        </div>
        <span className="badge badge-gold flex-shrink-0">{total} resp</span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {opts.map((opt, oi) => {
          const c   = poll.response_counts[oi] || 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const isCorrect = poll.correct_index === oi;
          return (
            <div key={oi}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                      color:      isCorrect ? '#22c55e' : '#64748b',
                    }}>
                    {String.fromCharCode(65+oi)}
                  </span>
                  <span style={{ color: isCorrect ? '#22c55e' : '#f1f5f9' }}>{opt} {isCorrect && '✓'}</span>
                </span>
                <span className="font-mono text-[11px]" style={{ color:'#475569' }}>{c} · {pct}%</span>
              </div>
              <div className="progress-track">
                <motion.div animate={{ width:`${pct}%` }} transition={{ duration:0.6, ease:'easeOut' }}
                  className="progress-fill"
                  style={{ background: isCorrect ? 'linear-gradient(90deg,#22c55e,#4ade80)' : undefined }}/>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Participant row ──────────────────────────────────────────────────────────
function ParticipantRow({ p, i }) {
  const statusColor = p.status === 'disqualified' ? '#ef4444' : p.status === 'warned' ? '#f97316' : '#22c55e';
  const statusBg    = p.status === 'disqualified' ? 'rgba(239,68,68,0.06)' : 'transparent';
  return (
    <motion.div
      initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: i * 0.025 }}
      className="flex items-center gap-3 px-5 py-3.5 transition-colors"
      style={{ background: statusBg, borderBottom:'1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background:`rgba(${colorRGB(statusColor)},0.12)`, color: statusColor }}>
        {p.guest_name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color:'#f1f5f9' }}>{p.guest_name || 'Anonymous'}</div>
        <div className="text-[10px] font-mono" style={{ color:'#334155' }}>{timeAgo(p.joined_at)}</div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {p.tab_switches > 0 && (
          <span className="badge" style={{
            background:`rgba(${colorRGB(statusColor)},0.1)`,
            color: statusColor,
            border:`1px solid rgba(${colorRGB(statusColor)},0.25)`,
          }}>
            {p.tab_switches}x switch
          </span>
        )}
        <span className={`badge badge-${p.status === 'active' ? 'green' : p.status === 'warned' ? 'orange' : 'red'}`}>
          {p.status}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────
function LeaderRow({ entry, rank }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
  const pct = entry.total > 0 ? Math.round((entry.score / entry.total) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: rank * 0.03 }}
      className="flex items-center gap-3 px-5 py-3.5"
      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
    >
      <div className="w-7 text-center text-sm font-bold flex-shrink-0" style={{ color:'#475569' }}>
        {medal || `#${rank}`}
      </div>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background:'rgba(240,180,41,0.12)', color:'#F0B429' }}>
        {entry.name?.[0]?.toUpperCase() || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate" style={{ color:'#f1f5f9' }}>{entry.name}</div>
        <div className="text-[10px] font-mono" style={{ color:'#334155' }}>
          {entry.score}/{entry.total} correct · {pct}%
        </div>
      </div>
      <div className="flex-shrink-0">
        <span className={`badge badge-${entry.status === 'active' ? 'green' : 'orange'}`}>{entry.status}</span>
      </div>
    </motion.div>
  );
}


// ─── AI Insights Panel ───────────────────────────────────────────────────────
function AIInsightsPanel({ sessionId }) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const fetch = async () => {
    setLoading(true); setError(null);
    try {
      const d = await AIInsightAPI.getSession(sessionId);
      setInsight(d.data);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to generate insights');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <h3 className="font-display text-xl font-semibold" style={{ color:'#f1f5f9' }}>
          🤖 AI Insights
        </h3>
        {!open ? (
          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => { setOpen(true); fetch(); }} className="btn-ghost !py-2 !px-4 text-sm">
            Generate Insights
          </motion.button>
        ) : (
          <button onClick={() => { setOpen(false); setInsight(null); }}
            style={{ fontSize:12, color:'#475569', background:'none', border:'none', cursor:'pointer' }}>
            ✕ Close
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div key="panel" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }}
            className="glass p-6">
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:12, color:'#8B949E', fontSize:14 }}>
                <motion.div animate={{ rotate:360 }} transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
                  style={{ width:18, height:18, border:'2px solid rgba(240,180,41,0.3)', borderTop:'2px solid #F0B429', borderRadius:'50%' }}/>
                Analysing session data…
              </div>
            )}
            {error && <div style={{ color:'#F85149', fontSize:14 }}>{error}</div>}
            {insight && !loading && (
              <div style={{ display:'grid', gap:16 }}>
                <div>
                  <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Summary</div>
                  <p style={{ color:'rgba(240,234,214,0.8)', fontSize:14, lineHeight:1.7 }}>{insight.summary}</p>
                </div>
                {insight.gaps?.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Knowledge Gaps</div>
                    <div style={{ display:'grid', gap:6 }}>
                      {insight.gaps.map((g, i) => (
                        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:13, color:'rgba(240,234,214,0.7)',
                          background:'rgba(248,81,73,0.05)', border:'1px solid rgba(248,81,73,0.12)', borderRadius:8, padding:'8px 12px' }}>
                          <span style={{ color:'#F85149', flexShrink:0 }}>⚠</span>{g}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {insight.suggestions?.length > 0 && (
                  <div>
                    <div style={{ fontSize:11, color:'rgba(240,234,214,0.4)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Teaching Suggestions</div>
                    <div style={{ display:'grid', gap:6 }}>
                      {insight.suggestions.map((s, i) => (
                        <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start', fontSize:13, color:'rgba(240,234,214,0.7)',
                          background:'rgba(63,185,80,0.05)', border:'1px solid rgba(63,185,80,0.12)', borderRadius:8, padding:'8px 12px' }}>
                          <span style={{ color:'#3FB950', flexShrink:0 }}>✓</span>{s}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ fontSize:11, color:'rgba(240,234,214,0.25)', textAlign:'right' }}>
                  {insight.cached ? 'Cached result' : 'Generated just now'} · Powered by Claude
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LiveDashboard({ sessionId, onBack }) {
  const [data, setData]       = useState(null);
  const [presence, setPresence] = useState(0);
  const [copied, setCopied]   = useState(false);
  const toast = useToast();

  const load = useCallback(() => {
    if (!sessionId) return;
    SessionAPI.live(sessionId).then(setData).catch(() => toast.error('Failed to load session'));
  }, [sessionId, toast]);

  useEffect(() => { load(); }, [load]);
  useSessionRoom(sessionId);

  useEffect(() => {
    if (!sessionId) return;
    const ping = () => emitSocket('presence:ping', { sessionId });
    ping();
    const id = setInterval(ping, 4000);
    return () => clearInterval(id);
  }, [sessionId]);

  useSocketEvents(useMemo(() => ({
    'presence:count': ({ count }) => setPresence(count),
    'session:participant_joined': ({ name }) => { toast.info(`${name} joined`, 'New participant'); load(); },
    'poll:update': () => load(),
    'session:cheat_update': ({ name, status, tab_switches }) => {
      if (status === 'warned')       toast.warn(`${name} switched tabs (${tab_switches}x)`, 'Tab switch');
      else if (status === 'disqualified') toast.error(`${name} disqualified`, 'Anti-cheat');
      load();
    },
  }), [toast, load]));

  const closeSession = async () => {
    if (!confirm('Close this session? All polls will be locked.')) return;
    try { await SessionAPI.close(sessionId); toast.info('Session closed'); load(); }
    catch { toast.error('Failed to close'); }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Session code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="grid gap-5"><SkeletonCard/><SkeletonCard/><SkeletonCard/></div>;

  const { session, participants, polls, stats, lecture_name, leaderboard = [] } = data;
  const isActive = session.status === 'active';

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <button onClick={onBack} className="text-sm mb-2.5 flex items-center gap-1.5 hover:underline" style={{ color:'#475569' }}>
            ← Back to sessions
          </button>
          <h2 className="font-display text-3xl font-bold" style={{ color:'#f1f5f9' }}>{session.title}</h2>
          <p className="text-sm mt-1 font-mono" style={{ color:'#475569' }}>{lecture_name}</p>
        </div>

        {/* Session code card + end btn */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="glass-card px-5 py-3 flex items-center gap-3">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest mb-1" style={{ color:'#334155' }}>Session Code</div>
              <span className="session-code">{session.code}</span>
            </div>
            <motion.button
              whileHover={{ scale:1.08 }} whileTap={{ scale:0.93 }}
              onClick={() => copyCode(session.code)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(240,180,41,0.08)', color: copied ? '#22c55e' : '#F0B429' }}
            >
              {copied
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg>
              }
            </motion.button>
          </div>

          {isActive && (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              onClick={closeSession} className="btn-danger !py-3">
              End Session
            </motion.button>
          )}
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Live presence — special tile */}
        <motion.div whileHover={{ y:-3 }} className="glass-card p-5 text-center"
          style={{ borderColor:'rgba(34,197,94,0.25)', boxShadow:'0 0 40px -16px rgba(34,197,94,0.2)' }}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full pulse-dot" style={{ background:'#22c55e' }}/>
            <span className="text-xs font-mono uppercase tracking-wider" style={{ color:'#22c55e' }}>Live</span>
          </div>
          <div className="font-display text-4xl font-bold" style={{ color:'#22c55e' }}>{presence}</div>
          <div className="text-[10px] mt-1 font-mono" style={{ color:'#334155' }}>online now</div>
        </motion.div>

        <StatTile label="Total Joined"   value={stats.total_participants} color="#f1f5f9"/>
        <StatTile label="Active"         value={stats.active}            color="#22c55e" glow/>
        <StatTile label="Warned"         value={stats.warned}            color="#f97316" glow/>
        <StatTile label="Disqualified"   value={stats.disqualified}      color="#ef4444" glow/>
      </div>

      {/* Questions + participants split */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Questions */}
        <div className="space-y-4">
          <h3 className="font-display text-xl font-semibold" style={{ color:'#f1f5f9' }}>
            Questions & Responses
          </h3>
          {polls.length === 0
            ? <div className="glass-card p-8 text-center text-sm" style={{ color:'#334155' }}>No polls in this session yet.</div>
            : polls.map((p, i) => <QuestionCard key={p.id} poll={p} index={i}/>)
          }
        </div>

        {/* Participants */}
        <div>
          <h3 className="font-display text-xl font-semibold mb-4" style={{ color:'#f1f5f9' }}>
            Participants ({participants.length})
          </h3>
          <div className="glass overflow-hidden">
            {participants.length === 0
              ? <div className="p-10 text-center text-sm" style={{ color:'#334155' }}>
                  Waiting for students to join…
                </div>
              : <div className="scroll-thin" style={{ maxHeight:480, overflowY:'auto' }}>
                  {participants.map((p, i) => <ParticipantRow key={p.id} p={p} i={i}/>)}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h3 className="font-display text-xl font-semibold mb-4" style={{ color:'#f1f5f9' }}>
            🏆 Leaderboard — Top Students
          </h3>
          <div className="glass overflow-hidden">
            <div className="scroll-thin" style={{ maxHeight:400, overflowY:'auto' }}>
              {leaderboard.map((entry, i) => (
                <LeaderRow key={entry.id} entry={entry} rank={i + 1} />
              ))}
            </div>
          </div>
        </div>
      )}
      {/* AI Insights */}
      <AIInsightsPanel sessionId={sessionId} />
    </div>
  );
}
