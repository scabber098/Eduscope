// NEW FILE: client/src/components/AnalyticsSummaryPanel.jsx
// Displays live backend stats: totalStudents, averageMarks, highestMarks, etc.
// Used in FacultyDashboard. Does NOT modify any existing component.
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AnalyticsSummaryAPI } from '../api/client';

const METRIC = ({ label, value, suffix = '', color = '#F0EAD6', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-5 flex flex-col gap-1"
  >
    <div className="text-xs uppercase tracking-wider" style={{ color: '#8B949E' }}>{label}</div>
    <div className="font-display text-3xl font-bold" style={{ color }}>
      {value ?? <span style={{ color: '#4a5060', fontSize: '1rem' }}>—</span>}
      {value != null && suffix && <span className="text-base font-normal ml-1" style={{ color: '#8B949E' }}>{suffix}</span>}
    </div>
  </motion.div>
);

export default function AnalyticsSummaryPanel() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    AnalyticsSummaryAPI.summary()
      .then(setData)
      .catch((err) => {
        const msg = err.response?.data?.error || err.message || 'Failed to load';
        setError(msg);
      });
  }, []);

  if (error) return (
    <div className="glass p-4 text-sm" style={{ color: '#F85149', borderColor: 'rgba(248,81,73,0.2)', border: '1px solid' }}>
      ⚠ Analytics summary unavailable: {error}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <METRIC label="Total Students"    value={data?.totalStudents}     color="#F0EAD6"  delay={0}   />
      <METRIC label="Avg. Marks"        value={data?.averageMarks}      color="#F0B429"  delay={0.07} suffix="pts" />
      <METRIC label="Highest Marks"     value={data?.highestMarks}      color="#3FB950"  delay={0.14} suffix="pts" />
      <METRIC label="Disqualified"      value={data?.disqualifiedCount} color="#F85149"  delay={0.21} />
      <METRIC label="Total Tab Switches" value={data?.totalTabSwitches} color="#E07B39"  delay={0.28} />
    </div>
  );
}
