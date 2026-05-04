// === FILE: client/src/pages/FacultyApp.jsx (PATCHED — black screen fix) ===
import { lazy, Suspense, useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import TabNav from '../components/TabNav';
import { SkeletonCard } from '../components/Skeleton';

const FacultyDashboard = lazy(() => import('./faculty/FacultyDashboard'));
const CreatePoll       = lazy(() => import('./faculty/CreatePoll'));
const ManageLectures   = lazy(() => import('./faculty/ManageLectures'));
const Sessions         = lazy(() => import('./faculty/Sessions'));
const Reports          = lazy(() => import('./faculty/Reports'));
const Students         = lazy(() => import('./faculty/Students'));
const ResponsePatterns = lazy(() => import('./faculty/ResponsePatterns'));
const ScheduledSessions = lazy(() => import('./faculty/ScheduledSessions'));


const TABS = [
  { key: 'dashboard',  label: 'Dashboard' },
  { key: 'create',     label: 'Create Quiz' },
  { key: 'sessions',   label: 'Live Sessions' },
  { key: 'scheduled',  label: 'Scheduled' },
  { key: 'patterns',   label: 'Response Patterns' },
  { key: 'lectures',   label: 'Lectures' },
  { key: 'reports',    label: 'Reports' },
  { key: 'students',   label: 'Students' },
];
const VIEWS = {
  dashboard:  FacultyDashboard,
  create:     CreatePoll,
  sessions:   Sessions,
  scheduled:  ScheduledSessions,
  patterns:   ResponsePatterns,
  lectures:   ManageLectures,
  reports:    Reports,
  students:   Students,
};

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
};

export default function FacultyApp() {
  const [tab, setTab] = useState('dashboard');
  // useTransition prevents Suspense from blanking the screen mid-navigation:
  // the old content stays visible while the new lazy chunk loads.
  const [isPending, startTransition] = useTransition();
  const V = VIEWS[tab];

  const handleTabChange = (newTab) => {
    startTransition(() => setTab(newTab));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <TabNav tabs={TABS} activeKey={tab} onChange={handleTabChange} />
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8" style={{ opacity: isPending ? 0.6 : 1, transition: 'opacity 0.2s' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ErrorBoundary wrapping Suspense prevents crash from blanking entire app */}
            <TabErrorBoundary key={tab}>
              <Suspense fallback={<TabSkeleton />}>
                <V />
              </Suspense>
            </TabErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Skeleton that matches app height to prevent layout jump ──────────────────
function TabSkeleton() {
  return (
    <div className="grid gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

// ── Error boundary — shows fallback UI instead of blank screen ───────────────
import { Component } from 'react';

class TabErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('[EduScope] Tab error:', err, info); }
  render() {
    if (this.state.error) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="glass p-12 text-center mt-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-display text-xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Something went wrong</h3>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>
            {this.state.error?.message || 'An unexpected error occurred in this tab.'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="btn-primary !px-6 !py-2.5 text-sm"
            onClick={() => this.setState({ error: null })}>
            Try again
          </motion.button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}
