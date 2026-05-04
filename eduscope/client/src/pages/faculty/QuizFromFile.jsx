// === FILE: client/src/pages/faculty/QuizFromFile.jsx ===
import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken() {
  return localStorage.getItem('pollcast_token') || '';
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(opts.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || json.message || 'Request failed');
  return json;
}

const selectStyle = {
  width: '100%', marginTop: 6, padding: '10px 12px',
  borderRadius: 10, border: '1px solid #444', fontSize: 14,
  outline: 'none', appearance: 'auto',
  backgroundColor: '#1e1e2e', color: '#ffffff', cursor: 'pointer',
};

function PreviewCard({ q, idx }) {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 12, padding: '14px 16px', marginBottom: 8,
    }}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
        <span style={{
          minWidth: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: 'rgba(240,180,41,0.15)', color: 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 12,
        }}>Q{idx + 1}</span>
        <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 1.5 }}>{q.question}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        {q.options.map((opt, i) => (
          <div key={i} style={{
            padding: '6px 10px', borderRadius: 8, fontSize: 13,
            background: i === q.correctIndex ? 'rgba(72,199,142,0.13)' : 'rgba(255,255,255,0.03)',
            border: i === q.correctIndex ? '1px solid rgba(72,199,142,0.4)' : '1px solid rgba(255,255,255,0.07)',
            color: i === q.correctIndex ? '#48c78e' : 'rgba(255,255,255,0.65)',
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <span style={{ fontWeight: 700, flexShrink: 0 }}>{letters[i]})</span>
            <span>{opt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Label({ children }) {
  return (
    <span style={{
      display: 'block', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.5)', marginBottom: 0,
    }}>{children}</span>
  );
}

export default function QuizFromFile({ onAccept }) {
  const { showToast } = useToast();
  const [topics, setTopics]           = useState([]);
  const [topic, setTopic]             = useState('');
  const [difficulty, setDifficulty]   = useState('medium');
  const [numQ, setNumQ]               = useState(5);
  const [loading, setLoading]         = useState(false);
  const [metaLoading, setMetaLoading] = useState(true);
  const [result, setResult]           = useState(null);
  const [step, setStep]               = useState('form');

  useEffect(() => {
    apiFetch('/questions/topics')
      .then(data => {
        const list = Array.isArray(data) ? data : (data.data?.topics || data.topics || []);
        setTopics(list);
        if (list.length) setTopic(list[0]);
      })
      .catch(() => {
        apiFetch('/quiz/from-file/meta')
          .then(d => {
            const list = d.data?.topics || d.topics || [];
            setTopics(list);
            if (list.length) setTopic(list[0]);
          })
          .catch(() => showToast('Could not load topics', 'error'));
      })
      .finally(() => setMetaLoading(false));
  }, []);

  async function handleGenerate() {
    if (!topic) return showToast('Select a topic first.', 'error');
    setLoading(true);
    try {
      const data = await apiFetch('/quiz/from-file', {
        method: 'POST',
        body: JSON.stringify({ topic, difficulty, numberOfQuestions: numQ }),
      });
      const questions = data.data?.questions || data.questions;
      const meta      = data.data?.meta      || data.meta || { topic, difficulty };
      if (!questions?.length) return showToast('No questions found for this combination.', 'error');
      setResult({ questions, meta });
      setStep('preview');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    onAccept?.(result.questions);
    showToast(`${result.questions.length} questions loaded ✓`, 'success');
    setStep('form');
    setResult(null);
  }

  if (step === 'form') return (
    <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 22 }}>🎯</span>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff' }}>Generate Quiz</h3>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Pick a topic and difficulty — questions load instantly</p>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <Label>Topic</Label>
        <select value={topic} onChange={e => setTopic(e.target.value)} disabled={metaLoading} style={{ ...selectStyle, opacity: metaLoading ? 0.5 : 1 }}>
          {metaLoading
            ? <option value="">Loading topics…</option>
            : topics.length === 0
              ? <option value="">No topics found</option>
              : topics.map(t => <option key={t} value={t}>{t}</option>)
          }
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <Label>Difficulty</Label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} style={selectStyle}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <Label>Number of Questions</Label>
          <input
            type="number" min={1} max={30} value={numQ}
            onChange={e => setNumQ(Math.min(30, Math.max(1, Number(e.target.value))))}
            style={selectStyle}
          />
        </div>
      </div>

      <button onClick={handleGenerate} disabled={loading || metaLoading || !topic}
        style={{
          width: '100%', padding: '12px', borderRadius: 11, border: 'none',
          background: (!loading && topic) ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)' : 'rgba(255,255,255,0.07)',
          color: (!loading && topic) ? '#1a1a2e' : 'rgba(255,255,255,0.3)',
          fontWeight: 700, fontSize: 14,
          cursor: (!loading && topic) ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
        }}>
        {loading ? '⟳ Loading questions…' : '⚡ Generate Quiz'}
      </button>
    </div>
  );

  return (
    <div className="glass" style={{ padding: 22, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 15, color: '#fff' }}>{result.questions.length} Questions Ready</h3>
          <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {result.meta.topic} · {result.meta.difficulty}
          </p>
        </div>
        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 8, background: 'rgba(240,180,41,0.12)', color: 'var(--gold)', border: '1px solid rgba(240,180,41,0.25)' }}>Preview</span>
      </div>

      <div style={{ maxHeight: 380, overflowY: 'auto', marginBottom: 14, paddingRight: 2 }}>
        {result.questions.map((q, i) => <PreviewCard key={i} q={q} idx={i} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={() => { setStep('form'); setResult(null); }}
          style={{ padding: '10px', borderRadius: 10, border: '1px solid rgba(240,180,41,0.35)', background: 'rgba(240,180,41,0.07)', color: 'var(--gold)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          ↺ Try Again
        </button>
        <button onClick={handleAccept}
          style={{ padding: '10px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-2) 100%)', color: '#1a1a2e', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          ✓ Use These Questions
        </button>
      </div>
    </div>
  );
}
