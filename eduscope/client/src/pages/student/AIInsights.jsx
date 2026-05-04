// === FILE: client/src/pages/student/AIInsights.jsx ===
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import nodejsLectures from '../../data/nodejsLectures';

const DIFFICULTY_COLORS = {
  Beginner: { bg: 'rgba(63,185,80,0.1)', border: 'rgba(63,185,80,0.25)', text: '#3FB950' },
  Intermediate: { bg: 'rgba(240,180,41,0.1)', border: 'rgba(240,180,41,0.25)', text: '#F0B429' },
  Advanced: { bg: 'rgba(248,81,73,0.1)', border: 'rgba(248,81,73,0.25)', text: '#F85149' },
};

function DifficultyBadge({ level }) {
  const c = DIFFICULTY_COLORS[level] || DIFFICULTY_COLORS.Beginner;
  return (
    <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
      {level}
    </span>
  );
}

function TopicPills({ topics }) {
  return (
    <div className="flex flex-wrap gap-2">
      {topics.map((t, i) => (
        <span key={i} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(139,148,158,0.1)', border: '1px solid rgba(139,148,158,0.15)', color: '#8B949E' }}>
          {t}
        </span>
      ))}
    </div>
  );
}

function InsightCard({ icon, title, children, delay = 0, accentColor = '#F0B429' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="glass p-6 rounded-2xl"
      style={{ borderLeft: `3px solid ${accentColor}` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-xl">{icon}</span>
        <h3 className="font-display text-lg font-semibold" style={{ color: '#F0EAD6' }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function ConceptExplanation({ summary }) {
  return (
    <InsightCard icon="📘" title="Concept Explanation" delay={0.05} accentColor="#58A6FF">
      <p className="text-sm leading-relaxed" style={{ color: '#C9D1D9' }}>{summary}</p>
    </InsightCard>
  );
}

function CommonMistakes({ mistakes }) {
  return (
    <InsightCard icon="⚠️" title="Common Mistakes" delay={0.1} accentColor="#F85149">
      <div className="space-y-2.5">
        {mistakes.map((m, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(248,81,73,0.05)', border: '1px solid rgba(248,81,73,0.1)' }}>
            <span className="text-xs mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ background: 'rgba(248,81,73,0.15)', color: '#F85149' }}>
              {i + 1}
            </span>
            <p className="text-sm" style={{ color: '#C9D1D9' }}>{m}</p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function RealWorldUsage({ usages }) {
  return (
    <InsightCard icon="💡" title="Real-world Use Cases" delay={0.15} accentColor="#3FB950">
      <div className="space-y-2.5">
        {usages.map((u, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(63,185,80,0.04)', border: '1px solid rgba(63,185,80,0.1)' }}>
            <span className="text-sm mt-0.5 shrink-0" style={{ color: '#3FB950' }}>▸</span>
            <p className="text-sm" style={{ color: '#C9D1D9' }}>{u}</p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function InterviewQuestions({ questions }) {
  return (
    <InsightCard icon="🎯" title="Important Interview Questions" delay={0.2} accentColor="#F0B429">
      <div className="space-y-2.5">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'rgba(240,180,41,0.04)', border: '1px solid rgba(240,180,41,0.1)' }}>
            <span className="text-xs mt-0.5 shrink-0 font-mono font-bold" style={{ color: '#F0B429' }}>Q{i + 1}</span>
            <p className="text-sm" style={{ color: '#C9D1D9' }}>{q}</p>
          </div>
        ))}
      </div>
    </InsightCard>
  );
}

function DifficultyLevel({ difficulty }) {
  const levels = ['Beginner', 'Intermediate', 'Advanced'];
  const idx = levels.indexOf(difficulty);
  return (
    <InsightCard icon="📊" title="Difficulty Level" delay={0.25} accentColor={DIFFICULTY_COLORS[difficulty]?.text || '#F0B429'}>
      <div className="flex items-center gap-4">
        <div className="flex gap-1.5">
          {levels.map((l, i) => (
            <div key={l} className="flex flex-col items-center gap-1">
              <div
                className="w-16 h-3 rounded-full transition-all"
                style={{
                  background: i <= idx
                    ? (DIFFICULTY_COLORS[difficulty]?.text || '#F0B429')
                    : 'rgba(139,148,158,0.15)',
                }}
              />
              <span className="text-[10px]" style={{ color: i <= idx ? '#F0EAD6' : '#484F58' }}>{l}</span>
            </div>
          ))}
        </div>
        <DifficultyBadge level={difficulty} />
      </div>
    </InsightCard>
  );
}

function QuickSummary({ summary }) {
  return (
    <InsightCard icon="🧠" title="Quick Summary" delay={0.3} accentColor="#A371F7">
      <div className="rounded-xl p-4" style={{ background: 'rgba(163,113,247,0.06)', border: '1px solid rgba(163,113,247,0.12)' }}>
        <p className="text-sm leading-relaxed" style={{ color: '#C9D1D9' }}>{summary}</p>
      </div>
    </InsightCard>
  );
}

export default function AIInsights() {
  const [selectedId, setSelectedId] = useState('');
  const lecture = nodejsLectures.find(l => l.id === selectedId);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>AI Insights</h2>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(63,185,80,0.1)', color: '#3FB950', border: '1px solid rgba(63,185,80,0.2)' }}>
            Node.js Lectures
          </span>
        </div>
        <p className="text-sm mt-1.5" style={{ color: '#8B949E' }}>
          Select a Node.js lecture to explore AI-powered learning insights.
        </p>
      </div>

      {/* Lecture Selector */}
      <div className="glass p-4 mb-6 rounded-2xl">
        <label className="text-xs uppercase tracking-wider block mb-2 font-medium" style={{ color: '#8B949E' }}>Select Lecture</label>
        <select
          className="input-field w-full md:w-auto md:min-w-[400px]"
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ background: '#161B22', color: selectedId ? '#F0EAD6' : '#8B949E' }}
        >
          <option value="">Choose a Node.js lecture…</option>
          {nodejsLectures.map(l => (
            <option key={l.id} value={l.id}>
              {l.title} — {l.difficulty}
            </option>
          ))}
        </select>
      </div>

      {/* Empty State */}
      {!lecture && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-14 text-center rounded-2xl">
          <div className="text-5xl mb-4 opacity-40">🤖</div>
          <h3 className="font-display text-xl font-semibold mb-2" style={{ color: '#F0EAD6' }}>No Lecture Selected</h3>
          <p style={{ color: '#8B949E' }}>Pick a Node.js lecture above to view detailed AI insights.</p>
        </motion.div>
      )}

      {/* Lecture Insights */}
      <AnimatePresence mode="wait">
        {lecture && (
          <motion.div
            key={lecture.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Lecture Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 mb-5 rounded-2xl"
              style={{ borderBottom: `2px solid ${DIFFICULTY_COLORS[lecture.difficulty]?.text || '#F0B429'}` }}
            >
              <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                <h3 className="font-display text-2xl font-bold" style={{ color: '#F0EAD6' }}>{lecture.title}</h3>
                <DifficultyBadge level={lecture.difficulty} />
              </div>
              <TopicPills topics={lecture.topics} />
            </motion.div>

            {/* Insight Cards Grid */}
            <div className="grid gap-5">
              <ConceptExplanation summary={lecture.summary} />

              <div className="grid md:grid-cols-2 gap-5">
                <CommonMistakes mistakes={lecture.common_mistakes} />
                <RealWorldUsage usages={lecture.real_world_usage} />
              </div>

              <InterviewQuestions questions={lecture.interview_questions} />

              <div className="grid md:grid-cols-2 gap-5">
                <DifficultyLevel difficulty={lecture.difficulty} />
                <QuickSummary summary={lecture.summary} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
