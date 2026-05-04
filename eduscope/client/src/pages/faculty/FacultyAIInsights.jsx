// === FILE: client/src/pages/faculty/FacultyAIInsights.jsx ===
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AIInsightAPI, SessionAPI } from '../../api/client';
import { SkeletonCard } from '../../components/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = { correct: '#3FB950', incorrect: '#F85149' };

function ClassPerformanceChart({ data }) {
  const pieData = [
    { name: 'Correct', value: data.correct, color: COLORS.correct },
    { name: 'Incorrect', value: data.incorrect, color: COLORS.incorrect },
  ];
  const accuracy = data.total ? Math.round((data.correct / data.total) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📊</span>
        <h3 className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>Class Performance</h3>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div style={{ width: 180, height: 180 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" strokeWidth={0}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-3">
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold font-display" style={{ color: accuracy >= 75 ? '#3FB950' : accuracy >= 50 ? '#F0B429' : '#F85149' }}>
              {accuracy}%
            </div>
            <div className="text-xs uppercase tracking-wider mt-1" style={{ color: '#8B949E' }}>Class Accuracy</div>
          </div>
          <div className="flex gap-4 flex-wrap justify-center md:justify-start">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full inline-block" style={{ background: d.color }} />
                <span className="text-sm" style={{ color: '#8B949E' }}>{d.name}: <strong style={{ color: '#F0EAD6' }}>{d.value}</strong></span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#8B949E' }}>Total: <strong style={{ color: '#F0EAD6' }}>{data.total}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TopicAccuracyChart({ topics }) {
  if (!topics?.length) return null;
  const barData = topics.map(t => ({
    topic: (t.topic || '').length > 14 ? t.topic.slice(0, 14) + '…' : t.topic,
    accuracy: t.accuracy ?? 0,
    fullTopic: t.topic,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">📌</span>
        <h3 className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>Topic-wise Accuracy</h3>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid stroke="rgba(240,234,214,0.04)" vertical={false} />
            <XAxis dataKey="topic" stroke="#8B949E" tick={{ fontSize: 11 }} />
            <YAxis stroke="#8B949E" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ background: 'rgba(22,27,34,0.95)', border: '1px solid rgba(240,234,214,0.06)', borderRadius: 10, color: '#F0EAD6' }}
              formatter={(v, name, props) => [`${v}%`, props.payload.fullTopic]}
            />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell key={i} fill={entry.accuracy >= 75 ? '#3FB950' : entry.accuracy >= 50 ? '#F0B429' : '#F85149'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 space-y-2">
        {topics.filter(t => (t.accuracy ?? 100) < 70).map((t, i) => (
          <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.12)' }}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm" style={{ color: '#F0EAD6' }}>{t.topic}</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,81,73,0.15)', color: '#F85149' }}>{t.accuracy}%</span>
            </div>
            {t.suggestion && <p className="text-xs" style={{ color: '#8B949E' }}>{t.suggestion}</p>}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function FacultyAIInsights() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    SessionAPI.list()
      .then(s => { setSessions(s); setLoadingSessions(false); })
      .catch(() => setLoadingSessions(false));
  }, []);

  useEffect(() => {
    if (!selectedSession) { setData(null); return; }
    setLoading(true);
    setError(null);
    AIInsightAPI.getFacultySession(selectedSession)
      .then(d => { setData(d); setError(null); })
      .catch(err => setError(err.response?.data?.error || 'Failed to load insights'))
      .finally(() => setLoading(false));
  }, [selectedSession]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>AI Insights</h2>
          {data?.source === 'gemini' && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(240,180,41,0.1)', color: '#F0B429', border: '1px solid rgba(240,180,41,0.2)' }}>
              Powered by Gemini AI
            </span>
          )}
        </div>
        <p className="text-sm mt-1" style={{ color: '#8B949E' }}>Class performance analysis per session.</p>
      </div>

      {/* Session selector */}
      <div className="glass p-4 mb-5">
        <label className="text-xs uppercase tracking-wider block mb-2" style={{ color: '#8B949E' }}>Select Session</label>
        <select
          className="input-field w-full md:w-auto md:min-w-[320px]"
          value={selectedSession}
          onChange={e => setSelectedSession(e.target.value)}
          disabled={loadingSessions}
          style={{ background: '#161B22', color: selectedSession ? '#F0EAD6' : '#8B949E' }}
        >
          <option value="">{loadingSessions ? 'Loading sessions…' : 'Choose a session…'}</option>
          {sessions.map(s => (
            <option key={s.id || s._id} value={s.id || s._id}>{s.title || s.code || s.id}</option>
          ))}
        </select>
      </div>

      {!selectedSession && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-12 text-center">
          <div className="text-4xl mb-4 opacity-40">🤖</div>
          <p style={{ color: '#8B949E' }}>Select a session to view class AI insights.</p>
        </motion.div>
      )}

      {loading && <div className="grid gap-4"><SkeletonCard /><SkeletonCard /></div>}

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-8 text-center">
          <p style={{ color: '#F85149' }}>{error}</p>
        </motion.div>
      )}

      {data && !loading && (
        <div className="grid gap-5">
          {data.summary && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6" style={{ borderLeft: '4px solid #F0B429' }}>
              <p className="text-sm" style={{ color: '#F0EAD6' }}>{data.summary}</p>
            </motion.div>
          )}
          {data.performanceChart && <ClassPerformanceChart data={data.performanceChart} />}
          <TopicAccuracyChart topics={data.weakTopics} />
          {data.studySuggestions?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📚</span>
                <h3 className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>Teaching Suggestions</h3>
              </div>
              <div className="space-y-2">
                {data.studySuggestions.map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.08)' }}>
                    <span className="text-sm mt-0.5" style={{ color: '#F0B429' }}>→</span>
                    <p className="text-sm" style={{ color: '#F0EAD6' }}>{s}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {data.quickTips?.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">⚡</span>
                <h3 className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>Quick Tips</h3>
              </div>
              <div className="grid gap-2">
                {data.quickTips.map((t, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(63,185,80,0.04)', border: '1px solid rgba(63,185,80,0.08)' }}>
                    <span className="text-sm mt-0.5" style={{ color: '#3FB950' }}>✦</span>
                    <p className="text-sm" style={{ color: '#F0EAD6' }}>{t}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
