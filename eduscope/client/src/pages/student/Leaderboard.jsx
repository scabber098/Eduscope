// === FILE: client/src/pages/student/Leaderboard.jsx (extended with uni/dept filters) ===
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AnalyticsAPI, UniversityAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { SkeletonRow } from '../../components/Skeleton';

export default function Leaderboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedUni, setSelectedUni] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);

  // Load universities on mount
  useEffect(() => {
    UniversityAPI.list().then(setUniversities).catch(() => {});
    // Default to user's university if available
    const u = JSON.parse(localStorage.getItem('pollcast_user') || '{}');
    if (u.university?.id || u.university_id) {
      setSelectedUni(u.university?.id || u.university_id || '');
    }
  }, []);

  // Load departments when university changes
  useEffect(() => {
    setSelectedDept('');
    setDepartments([]);
    if (selectedUni) {
      UniversityAPI.departments(selectedUni).then(setDepartments).catch(() => {});
    }
  }, [selectedUni]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(() => {
    setLoading(true);
    const params = {};
    if (selectedUni) params.universityId = selectedUni;
    if (selectedDept) params.departmentId = selectedDept;
    AnalyticsAPI.leaderboard(params)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [selectedUni, selectedDept]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  const uniName = universities.find(u => u.id === selectedUni)?.short_name;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-3xl font-bold" style={{ color: '#F0EAD6' }}>
          Leaderboard {uniName ? `\u2014 ${uniName}` : ''}
        </h2>
        <p className="text-sm" style={{ color: '#8B949E' }}>
          Top students by participation + accuracy score
        </p>
      </div>

      {/* Filters */}
      <div className="glass p-4 mb-4 flex flex-wrap gap-3 items-center">
        <label className="text-xs font-mono uppercase tracking-wider" style={{ color: '#64748b' }}>Filter:</label>
        <select
          value={selectedUni}
          onChange={e => setSelectedUni(e.target.value)}
          className="rounded-lg px-3 py-2 text-sm border focus:outline-none"
          style={{ background: 'rgba(6,8,16,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }}
        >
          <option value="">All Universities</option>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>
          ))}
        </select>

        {departments.length > 0 && (
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm border focus:outline-none"
            style={{ background: 'rgba(6,8,16,0.8)', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }}
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="glass p-6 md:p-8 space-y-3">
        {loading || !rows ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : rows.length === 0 ? (
          <p className="text-center py-8 text-sm" style={{ color: '#64748b' }}>
            No students found for this filter.
          </p>
        ) : (
          rows.map((r, i) => {
            const me = r.id === user?.id;
            const topScore = rows[0]?.score || 100;
            const w = topScore > 0 ? (r.score / topScore) * 100 : 0;
            const medal = i === 0 ? '\u{1F947}' : i === 1 ? '\u{1F948}' : i === 2 ? '\u{1F949}' : null;

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="relative p-4 rounded-xl border transition-colors"
                style={{
                  borderColor: me ? '#F0B429' : 'rgba(240,234,214,0.06)',
                  background: me ? 'rgba(240,180,41,0.04)' : 'transparent',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 text-center font-display text-2xl font-bold"
                    style={{ color: i < 3 ? '#F0B429' : '#8B949E' }}>
                    {medal || '#' + r.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate" style={{ color: me ? '#F0B429' : '#F0EAD6' }}>
                        {r.name}
                      </span>
                      {me && <span className="badge gold-gradient font-semibold" style={{ color: '#0A0D12' }}>You</span>}
                      {r.department && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}>
                          {r.department}
                        </span>
                      )}
                    </div>
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(240,234,214,0.04)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: w + '%' }}
                        transition={{ duration: 1, delay: 0.3 + i * 0.04 }}
                        className={'h-full rounded-full' + (me ? ' gold-gradient' : '')}
                        style={me ? {} : { background: 'rgba(240,234,214,0.2)' }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-xl font-bold" style={{ color: '#F0EAD6' }}>{r.score}</div>
                    <div className="text-[10px]" style={{ color: '#8B949E' }}>
                      {r.accuracy}% acc &middot; {r.answered} ans
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
