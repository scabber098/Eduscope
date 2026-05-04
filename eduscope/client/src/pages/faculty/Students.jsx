import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonRow } from '../../components/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';

import { StudentAPI } from '../../api/client';

// Direct fetch — no axios interceptor, no auth token needed for students endpoint
async function apiFetch(path, options = {}) {
  const url = `/api${path}`;
  console.log(`[Students] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : '');
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  console.log(`[Students] response ${res.status}:`, data);
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const RANK_LABEL = (rank) => {
  if (rank === 1) return '🥇 1st';
  if (rank === 2) return '🥈 2nd';
  if (rank === 3) return '🥉 3rd';
  return `#${rank}`;
};

const RANK_COLOR = (rank) => {
  if (rank === 1) return '#F0B429';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#E07B39';
  return '#8B949E';
};

const EMPTY_FORM = { name: '', class: '', section: '', marks: '' };
const PAGE_SIZE  = 20;

export default function Students() {
  const [students, setStudents]         = useState(null);
  const [loadError, setLoadError]       = useState('');
  const [query, setQuery]               = useState('');
  const [uniFilter, setUniFilter]       = useState('');
  const [dqFilter, setDqFilter]         = useState('');       // '' | 'true' | 'false'
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [exporting, setExporting]       = useState(false);
  const debounced                       = useDebounce(query, 300);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState('');

  // ── Load students from backend (with server-side pagination + filtering) ──
  const load = useCallback(() => {
    setLoadError('');
    const params = { page, limit: PAGE_SIZE };
    if (uniFilter)  params.university     = uniFilter;
    if (dqFilter)   params.isDisqualified = dqFilter;
    console.log('[Students] loading from GET /api/students...', params);
    StudentAPI.list(params)
      .then((data) => {
        console.log('[Students] loaded:', data.students?.length, 'students');
        setStudents(Array.isArray(data.students) ? data.students : []);
        setPagination(data.pagination || null);
      })
      .catch((err) => {
        console.error('[Students] load failed:', err.message);
        setLoadError(err.response?.data?.error || err.message);
        setStudents([]);
      });
  }, [page, uniFilter, dqFilter]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [uniFilter, dqFilter]);

  // ── Client-side text search on the current page ──
  const filtered = (() => {
    if (!students) return [];
    const q = debounced.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) =>
      (s.name               || '').toLowerCase().includes(q) ||
      (s.class              || '').toLowerCase().includes(q) ||
      (s.section            || '').toLowerCase().includes(q) ||
      (s.university_name    || '').toLowerCase().includes(q) ||
      (s.registrationNumber || '').toLowerCase().includes(q)
    );
  })();

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await StudentAPI.export();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `students_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setExporting(false);
    }
  };

  // ── Add student ─────────────────────────────────────────────────────────────
  const handleAdd = async (e) => {
    e.preventDefault();
    setFormError('');

    const { name, class: cls, section, marks } = form;
    if (!name.trim())    return setFormError('Name is required.');
    if (!cls.trim())     return setFormError('Class is required.');
    if (!section.trim()) return setFormError('Section is required.');
    if (marks === '')    return setFormError('Marks is required.');
    if (isNaN(Number(marks)) || Number(marks) < 0)
                         return setFormError('Marks must be a valid non-negative number.');

    setSubmitting(true);
    try {
      await apiFetch('/students', {
        method: 'POST',
        body: JSON.stringify({
          name:    name.trim(),
          class:   cls.trim(),
          section: section.trim(),
          marks:   Number(marks),
        }),
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      console.error('[Students] add failed:', err.message);
      setFormError(err.message || 'Failed to add student.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete student ──────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student?')) return;
    try {
      await apiFetch(`/students/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      console.error('[Students] delete failed:', err.message);
      alert('Delete failed: ' + err.message);
    }
  };

  // ── Block / Unblock student ────────────────────────────────────────────────
  const handleBlock = async (registrationNumber, currentlyBlocked) => {
    const action = currentlyBlocked ? 'unblock' : 'block';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this student?`)) return;
    try {
      if (currentlyBlocked) {
        await StudentAPI.unblock(registrationNumber);
      } else {
        await StudentAPI.block(registrationNumber);
      }
      load();
    } catch (err) {
      alert(`Failed to ${action}: ` + (err.response?.data?.error || err.message));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header row */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>
            Students
          </h2>
          <p className="text-sm" style={{ color: '#8B949E' }}>
            Ranked by marks ·{' '}
            {pagination
              ? `${pagination.total} total · page ${pagination.page} of ${pagination.totalPages}`
              : students
              ? `${students.length} loaded`
              : 'loading…'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <input
            className="input-field !py-2 md:w-56"
            placeholder="Search name / class / reg no…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select
            className="input-field !py-2 md:w-48"
            value={dqFilter}
            onChange={(e) => setDqFilter(e.target.value)}
            style={{ background: '#161B22', color: dqFilter ? '#F0EAD6' : '#8B949E' }}
          >
            <option value="">All Statuses</option>
            <option value="false">Active only</option>
            <option value="true">Disqualified only</option>
          </select>
          <button
            className="btn-primary !py-2 !px-4 text-sm"
            onClick={() => { setShowForm((v) => !v); setFormError(''); setForm(EMPTY_FORM); }}
          >
            {showForm ? '✕ Cancel' : '+ Add Student'}
          </button>
          <button
            className="text-xs px-3 py-2 rounded transition-colors"
            style={{ color: exporting ? '#8B949E' : '#3FB950', border: '1px solid rgba(63,185,80,0.25)' }}
            onClick={handleExport}
            disabled={exporting}
            title="Export all students as CSV"
          >
            {exporting ? '⏳ Exporting…' : '⬇ Export CSV'}
          </button>
          <button
            className="text-xs px-3 py-2 rounded transition-colors"
            style={{ color: '#8B949E', border: '1px solid rgba(240,234,214,0.08)' }}
            onClick={load}
            title="Refresh list from database"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="glass p-4 mb-4 text-sm" style={{ color: '#F85149', borderColor: 'rgba(248,81,73,0.2)', borderWidth: 1 }}>
          ⚠ Could not load students: {loadError}
          <button className="ml-3 underline" onClick={load}>Retry</button>
        </div>
      )}

      {/* Add student form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass p-6 mb-6"
          >
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: '#F0EAD6' }}>
              Add New Student
            </h3>
            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: '#8B949E' }}>Name *</label>
                <input className="input-field w-full" placeholder="e.g. Arjun Sharma" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: '#8B949E' }}>Class *</label>
                <input className="input-field w-full" placeholder="e.g. 10th, B.Tech 3rd Year" value={form.class}
                  onChange={(e) => setForm((f) => ({ ...f, class: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: '#8B949E' }}>Section *</label>
                <input className="input-field w-full" placeholder="e.g. A, B, C" value={form.section}
                  onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: '#8B949E' }}>Marks *</label>
                <input className="input-field w-full" placeholder="e.g. 95" type="number" min="0" step="any" value={form.marks}
                  onChange={(e) => setForm((f) => ({ ...f, marks: e.target.value }))} />
              </div>
              {formError && (
                <div className="md:col-span-2 text-sm font-medium" style={{ color: '#F85149' }}>⚠ {formError}</div>
              )}
              <div className="md:col-span-2">
                <button type="submit" className="btn-primary !py-2 !px-6" disabled={submitting}>
                  {submitting ? 'Saving…' : 'Save Student'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Students table */}
      {students === null ? (
        <div className="glass p-5">
          {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass p-12 text-center" style={{ color: '#4a5060' }}>
          {students.length === 0
            ? 'No students match the selected filters.'
            : 'No students match your search.'}
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Table header */}
          <div
            className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-xs uppercase tracking-wider border-b"
            style={{ color: '#8B949E', borderColor: 'rgba(240,234,214,0.04)' }}
          >
            <div className="col-span-1">Rank</div>
            <div className="col-span-2">Name</div>
            <div className="col-span-2">University</div>
            <div className="col-span-1">Reg No.</div>
            <div className="col-span-1">Class</div>
            <div className="col-span-1">Switches</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-3">Marks / Actions</div>
          </div>

          {/* Rows */}
          {filtered.map((s, i) => (
            <motion.div
              key={s.id || i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.025, 0.3) }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 border-b last:border-0 transition-colors hover:bg-[rgba(240,180,41,0.02)]"
              style={{ borderColor: 'rgba(240,234,214,0.03)' }}
            >
              <div className="md:col-span-1 flex items-center">
                <span className="font-mono text-sm font-bold" style={{ color: RANK_COLOR(s.rank) }}>
                  {RANK_LABEL(s.rank)}
                </span>
              </div>
              <div className="md:col-span-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center font-semibold text-sm flex-shrink-0"
                  style={{ color: '#0A0D12' }}>
                  {(s.name || '?')[0].toUpperCase()}
                </div>
                <span className="font-medium text-sm truncate" style={{ color: '#F0EAD6' }}>{s.name}</span>
              </div>
              <div className="md:col-span-2 text-xs self-center truncate" style={{ color: '#8B949E' }}>
                {s.university_name || '—'}
              </div>
              <div className="md:col-span-1 text-xs self-center font-mono" style={{ color: '#8B949E' }}>
                {s.registrationNumber || '—'}
              </div>
              <div className="md:col-span-1 text-xs self-center" style={{ color: '#8B949E' }}>
                {s.class || '—'}{s.section ? ` / ${s.section}` : ''}
              </div>
              <div className="md:col-span-1 self-center">
                <span className="text-xs font-mono font-bold" style={{
                  color: s.tabSwitchCount >= 3 ? '#F85149' : s.tabSwitchCount >= 1 ? '#F0B429' : '#3FB950'
                }}>
                  {s.tabSwitchCount || 0}×
                </span>
              </div>
              <div className="md:col-span-1 self-center flex flex-col gap-1">
                {s.isBlocked && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(248,81,73,0.15)', color: '#F85149', border: '1px solid rgba(248,81,73,0.3)' }}>
                    BLOCKED
                  </span>
                )}
                {s.isDisqualified && !s.isBlocked && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(248,81,73,0.08)', color: '#F85149', border: '1px solid rgba(248,81,73,0.2)' }}>
                    DQ'd
                  </span>
                )}
                {!s.isBlocked && !s.isDisqualified && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{ background: 'rgba(63,185,80,0.08)', color: '#3FB950', border: '1px solid rgba(63,185,80,0.2)' }}>
                    Active
                  </span>
                )}
              </div>
              <div className="md:col-span-3 flex items-center justify-between gap-2">
                <span className="font-display text-lg font-bold" style={{ color: '#F0EAD6' }}>{s.marks}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {s.registrationNumber && (
                    <button
                      onClick={() => handleBlock(s.registrationNumber, s.isBlocked)}
                      className="text-xs px-2 py-1 rounded"
                      style={s.isBlocked
                        ? { color: '#3FB950', border: '1px solid rgba(63,185,80,0.3)' }
                        : { color: '#F0B429', border: '1px solid rgba(240,180,41,0.3)' }
                      }
                    >
                      {s.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                  )}
                  {s.id && (
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-xs px-2 py-1 rounded"
                      style={{ color: '#F85149', border: '1px solid rgba(248,81,73,0.2)' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {pagination && pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 mt-6"
        >
          <button
            className="text-xs px-3 py-2 rounded disabled:opacity-30"
            style={{ color: '#8B949E', border: '1px solid rgba(240,234,214,0.08)' }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            ← Prev
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 2)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
              acc.push(p);
              return acc;
            }, [])
            .map((p, i) =>
              p === '…' ? (
                <span key={`ellipsis-${i}`} className="text-xs px-1" style={{ color: '#4a5060' }}>…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="text-xs w-8 h-8 rounded font-mono"
                  style={{
                    background: p === page ? 'rgba(240,180,41,0.15)' : 'transparent',
                    color: p === page ? '#F0B429' : '#8B949E',
                    border: p === page ? '1px solid rgba(240,180,41,0.3)' : '1px solid rgba(240,234,214,0.06)',
                  }}
                >
                  {p}
                </button>
              )
            )}
          <button
            className="text-xs px-3 py-2 rounded disabled:opacity-30"
            style={{ color: '#8B949E', border: '1px solid rgba(240,234,214,0.08)' }}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
          >
            Next →
          </button>
        </motion.div>
      )}
    </div>
  );
}
