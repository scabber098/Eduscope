// === FILE: client/src/pages/faculty/CreatePoll.jsx ===
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LectureAPI, SessionAPI } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import QuizFromFile from './QuizFromFile';        // Quiz from questions.json

function QuestionBuilder({ q, idx, onChange, onRemove, total }) {
  const setField = (field, val) => onChange(idx, { ...q, [field]: val });
  const setOption = (i, v) => { const o = [...q.options]; o[i] = v; setField('options', o); };
  const addOption = () => q.options.length < 6 && setField('options', [...q.options, '']);
  const removeOption = (i) => {
    if (q.options.length <= 2) return;
    setField('options', q.options.filter((_,j) => j !== i));
    if (q.correctIndex != null && q.correctIndex >= q.options.length - 1) setField('correctIndex', null);
  };
  const toggleCorrect = (i) => {
    // Clicking already-selected correct answer deselects it (→ participation only)
    setField('correctIndex', q.correctIndex === i ? null : i);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, x: -40, scale: 0.95 }}
      transition={{ duration: 0.35 }}
      className="glass p-6 relative overflow-hidden">
      {/* Question number badge */}
      <div className="absolute top-0 left-0 w-12 h-12 flex items-center justify-center font-display text-lg font-bold rounded-br-2xl"
        style={{ background: 'rgba(240, 180, 41, 0.1)', color: '#F0B429' }}>
        Q{idx + 1}
      </div>

      {total > 1 && (
        <button onClick={() => onRemove(idx)} className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-[rgba(248,81,73,0.15)]"
          style={{ color: '#8B949E' }} title="Remove question">✕</button>
      )}

      <div className="pt-8 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Question</label>
          <textarea className="input-field mt-1 resize-none" rows={2} value={q.question} onChange={e => setField('question', e.target.value)}
            placeholder="e.g. What is entropy a measure of?"/>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Options ({q.options.length}/6)</label>
            {q.options.length < 6 && <button type="button" onClick={addOption} className="text-xs hover:underline" style={{ color: '#F0B429' }}>+ Add</button>}
          </div>
          <div className="text-xs mb-2" style={{ color: q.correctIndex == null ? '#F0B429' : '#4a5060' }}>
            {q.correctIndex == null
              ? '⚬ Participation only — click an option below to set a correct answer'
              : `✓ Option ${String.fromCharCode(65 + q.correctIndex)} is correct · click it again to unset`}
          </div>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {q.options.map((opt, i) => (
                <motion.div key={i} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2">
                  <button type="button" onClick={() => toggleCorrect(i)} title={q.correctIndex === i ? 'Click to unset correct answer' : 'Mark as correct'}
                    className="w-9 h-9 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      borderColor: q.correctIndex === i ? '#3FB950' : 'rgba(240,234,214,0.08)',
                      background: q.correctIndex === i ? 'rgba(63,185,80,0.15)' : 'transparent',
                      color: q.correctIndex === i ? '#3FB950' : '#8B949E',
                    }}>
                    {q.correctIndex === i ? '✓' : String.fromCharCode(65 + i)}
                  </button>
                  <input className="input-field" value={opt} onChange={e => setOption(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}/>
                  {q.options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)}
                      className="w-9 h-9 flex-shrink-0 rounded-lg border flex items-center justify-center transition-colors hover:border-[#F85149] hover:text-[#F85149]"
                      style={{ borderColor: 'rgba(240,234,214,0.08)', color: '#8B949E' }}>✕</button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Tags (comma-separated)</label>
          <input className="input-field mt-1" value={q.tags} onChange={e => setField('tags', e.target.value)} placeholder="Thermodynamics, Chapter 3"/>
        </div>
      </div>
    </motion.div>
  );
}

function PreviewCard({ q, idx }) {
  if (!q.question.trim()) return null;
  const filled = q.options.filter(o => o.trim());
  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="glass-subtle p-4 text-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
          style={{ background: 'rgba(240,180,41,0.15)', color: '#F0B429' }}>Q{idx + 1}</span>
        <span className="font-medium truncate" style={{ color: '#F0EAD6' }}>{q.question}</span>
      </div>
      {filled.map((o, i) => (
        <div key={i} className="flex items-center gap-2 ml-8 mb-1">
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{
              border: q.correctIndex === i ? '2px solid #3FB950' : '1px solid rgba(240,234,214,0.1)',
              color: q.correctIndex === i ? '#3FB950' : '#8B949E',
            }}>{String.fromCharCode(65 + i)}</span>
          <span style={{ color: '#8B949E' }}>{o}</span>
        </div>
      ))}
      {q.correctIndex == null && (
        <div className="ml-8 text-[10px] mt-1" style={{ color: '#F0B429' }}>⚬ Participation only</div>
      )}
    </motion.div>
  );
}

export default function CreatePoll() {
  const toast = useToast();
  const [lectures, setLectures] = useState([]);
  const [lectureId, setLectureId] = useState('');
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(null);
  const [pollDuration, setPollDuration] = useState(null); // NEW: per-poll timer in minutes
  const [questions, setQuestions] = useState([{ question: '', options: ['', ''], correctIndex: null, tags: '' }]);
  const [launching, setLaunching] = useState(false);
  const [result, setResult] = useState(null);
  const [showFileQuiz, setShowFileQuiz] = useState(false); // quiz from file panel

  // Load generated questions into the builder (shared by both AI and file quiz)
  const handleAIAccept = (qs) => { setQuestions(qs); setShowFileQuiz(false); };

  useEffect(() => { LectureAPI.list().then(ls => { setLectures(ls); if (ls[0]) setLectureId(ls[0].id); }); }, []);

  const updateQ = (i, q) => { const n = [...questions]; n[i] = q; setQuestions(n); };
  const removeQ = (i) => { if (questions.length <= 1) return; setQuestions(questions.filter((_, j) => j !== i)); };
  const addQ = () => setQuestions([...questions, { question: '', options: ['', ''], correctIndex: null, tags: '' }]);

  const launch = async (e) => {
    e.preventDefault();
    const valid = questions.filter(q => q.question.trim() && q.options.filter(o => o.trim()).length >= 2);
    if (!lectureId) return toast.error('Pick a lecture');
    if (valid.length === 0) return toast.error('Add at least one valid question');

    setLaunching(true);
    try {
      const res = await SessionAPI.create({
        lectureId,
        title: title.trim() || 'Live Session',
        timeLimit: timeLimit || null,
        pollDuration: pollDuration || null, // NEW: per-student poll timer (minutes)
        questions: valid.map(q => ({
          question: q.question.trim(),
          options: q.options.map(o => o.trim()).filter(Boolean),
          correctIndex: q.correctIndex,
          tags: Array.isArray(q.tags) ? q.tags : q.tags.split(',').map(t => t.trim()).filter(Boolean),
        })),
      });
      setResult(res);
      toast.success(`Session created with code ${res.code}`, `${valid.length} question${valid.length > 1 ? 's' : ''} launched`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to launch');
    } finally { setLaunching(false); }
  };

  // Success screen with code
  if (result) {
    return (
      <div className="grid gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass p-8 md:p-12 text-center max-w-2xl mx-auto w-full">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'rgba(63,185,80,0.1)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="#3FB950" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="font-display text-3xl font-bold mb-2" style={{ color: '#F0EAD6' }}>Session is Live!</h2>
          <p className="mb-6" style={{ color: '#8B949E' }}>Share this code with your students:</p>

          <div className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl mb-6"
            style={{ background: 'rgba(240, 180, 41, 0.08)', border: '2px solid rgba(240, 180, 41, 0.25)' }}>
            <span className="font-mono text-5xl md:text-6xl font-bold tracking-[0.2em] gold-text">{result.code}</span>
          </div>

          <div className="flex gap-3 justify-center mb-8">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => { navigator.clipboard.writeText(result.code); toast.success('Code copied!'); }}
              className="btn-ghost flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2"/></svg>
              Copy Code
            </motion.button>
          </div>

          <div className="text-sm" style={{ color: '#8B949E' }}>
            {result.polls?.length} question{result.polls?.length !== 1 ? 's' : ''} · {result.title}
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <button onClick={() => { setResult(null); setQuestions([{ question: '', options: ['',''], correctIndex: null, tags: '' }]); setTitle(''); }}
              className="btn-ghost">Create Another</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Builder */}
      <form onSubmit={launch} className="lg:col-span-3 space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
          <h2 className="font-display text-2xl font-bold mb-1" style={{ color: '#F0EAD6' }}>Create Quiz</h2>
          <p className="text-sm mb-6" style={{ color: '#8B949E' }}>Build multiple questions. Students join with a unique code.</p>

          <div className="grid md:grid-cols-3 gap-4 mb-2">
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Lecture</label>
              <select className="input-field mt-1" value={lectureId} onChange={e => setLectureId(e.target.value)}>
                {lectures.length === 0 && <option value="">No lectures</option>}
                {lectures.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Session title</label>
              <input className="input-field mt-1" value={title} onChange={e => setTitle(e.target.value)} placeholder="Week 5 Quiz"/>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>Time limit</label>
              <select className="input-field mt-1" value={timeLimit || ''} onChange={e => setTimeLimit(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Unlimited</option>
                <option value="30">30 seconds</option>
                <option value="60">60 seconds</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
              </select>
            </div>
            {/* NEW: Per-student poll timer */}
            <div>
              <label className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>
                Poll timer <span style={{ color: '#F0B429' }}>⏱ new</span>
              </label>
              <select
                className="input-field mt-1"
                value={pollDuration || ''}
                onChange={e => setPollDuration(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">No auto-submit</option>
                <option value="1">1 minute</option>
                <option value="2">2 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
              <p className="text-[10px] mt-1" style={{ color: '#4a5060' }}>
                Auto-submits student answer when timer expires
              </p>
            </div>
          </div>
        </motion.div>

        <AnimatePresence initial={false}>
          {questions.map((q, i) => (
            <QuestionBuilder key={i} q={q} idx={i} onChange={updateQ} onRemove={removeQ} total={questions.length}/>
          ))}
        </AnimatePresence>

        <motion.button type="button" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={addQ} className="w-full py-4 rounded-2xl border-2 border-dashed text-sm font-medium transition-colors"
          style={{ borderColor: 'rgba(240,234,214,0.08)', color: '#8B949E', background: 'rgba(22,27,34,0.2)' }}>
          + Add Question (Q{questions.length + 1})
        </motion.button>

        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} disabled={launching}
          className="btn-primary w-full text-base py-4">
          {launching ? 'Launching…' : `⚡ Launch Session — ${questions.filter(q => q.question.trim()).length} Question${questions.filter(q => q.question.trim()).length !== 1 ? 's' : ''}`}
        </motion.button>
      </form>

      {/* Preview */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="lg:col-span-2 space-y-4">

        {/* ── Quiz from File ── */}
        <div>
          <button type="button" onClick={() => setShowFileQuiz(v => !v)}
            style={{
              width: '100%', padding: '10px 16px', borderRadius: 11,
              border: `1px solid ${showFileQuiz ? 'rgba(72,199,142,0.5)' : 'rgba(72,199,142,0.2)'}`,
              background: showFileQuiz ? 'rgba(72,199,142,0.1)' : 'rgba(72,199,142,0.03)',
              color: showFileQuiz ? '#48c78e' : 'rgba(72,199,142,0.7)', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 0.2s',
            }}>
            🎯 {showFileQuiz ? 'Hide Quiz Generator' : 'Generate Quiz from Topics'}
          </button>
          <AnimatePresence>
            {showFileQuiz && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginTop: 8 }}>
                <QuizFromFile onAccept={handleAIAccept} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="glass p-5">
          <h3 className="text-xs uppercase tracking-widest mb-4" style={{ color: '#8B949E' }}>Live Preview</h3>
          <div className="space-y-3">
            {questions.map((q, i) => <PreviewCard key={i} q={q} idx={i}/>)}
            {questions.every(q => !q.question.trim()) && (
              <div className="text-sm text-center py-6" style={{ color: '#4a5060' }}>Start typing to see preview</div>
            )}
          </div>
        </div>

        <div className="glass p-5 text-center">
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: '#8B949E' }}>Session code will be generated</div>
          <div className="font-mono text-3xl font-bold tracking-[0.3em]" style={{ color: '#4a5060' }}>• • • • • •</div>
          <div className="text-[10px] mt-2" style={{ color: '#4a5060' }}>Students enter this to join</div>
        </div>
      </motion.div>
    </div>
  );
}
