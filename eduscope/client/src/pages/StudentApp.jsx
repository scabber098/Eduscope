// === FILE: client/src/pages/StudentApp.jsx ===
import { lazy, Suspense, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import TabNav from '../components/TabNav';
import { SkeletonCard } from '../components/Skeleton';

const StudentDashboard = lazy(() => import('./student/StudentDashboard'));
const ActivePolls      = lazy(() => import('./student/ActivePolls'));
const JoinWithCode     = lazy(() => import('./student/JoinWithCode'));
const StudentHistory   = lazy(() => import('./student/StudentHistory'));
const Leaderboard      = lazy(() => import('./student/Leaderboard'));
const AIInsights       = lazy(() => import('./student/AIInsights'));

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'join',      label: '🔑 Join with Code' },
  { key: 'active',    label: 'Active Polls' },
  { key: 'history',   label: 'My History' },
  { key: 'insights',  label: '🤖 AI Insights' },
  { key: 'leaderboard', label: 'Leaderboard' },
];

const VIEWS = {
  dashboard:   StudentDashboard,
  join:        JoinWithCode,
  active:      ActivePolls,
  history:     StudentHistory,
  insights:    AIInsights,
  leaderboard: Leaderboard,
};

export default function StudentApp() {
  const [tab, setTab] = useState('join'); // default to join so student sees it immediately
  const V = VIEWS[tab];
  return (
    <div className="min-h-screen">
      <Navbar />
      <TabNav tabs={TABS} activeKey={tab} onChange={setTab} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.28 }}
          >
            <Suspense fallback={<SkeletonCard />}><V /></Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
