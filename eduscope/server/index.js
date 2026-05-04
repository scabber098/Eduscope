// === FILE: server/index.js (EDUSCOPE SaaS — MongoDB) ===
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { initSocket } = require('./socket');
const { connectDB } = require('./db');

const authRoutes        = require('./routes/auth');
const lectureRoutes     = require('./routes/lectures');
const pollRoutes        = require('./routes/polls');
const responseRoutes    = require('./routes/responses');
const reportRoutes      = require('./routes/reports');
const sessionRoutes     = require('./routes/sessions');
const universityRoutes  = require('./routes/universities');
const analyticsRoutes   = require('./routes/analytics');
const studentRoutes     = require('./routes/students');
const studentActivityRoutes = require('./routes/studentActivity');

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: [CLIENT_ORIGIN, 'http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// Request logger for debugging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', (_req, res) => res.json({ ok: true, time: Date.now() }));

// === NEW: additional routes (additive only) ===
const analyticsSummaryRoutes = require('./routes/analyticsSummary');
const pollTimerRoutes        = require('./routes/pollTimer');
const { loginLimiter, pollJoinLimiter } = require('./middleware/rateLimiter');

// Original routes (rate-limited where needed, logic unchanged)
app.use('/api/auth',        loginLimiter,    authRoutes);
app.use('/api/lectures',    lectureRoutes);
app.use('/api/polls',       pollRoutes);
app.use('/api/responses',   responseRoutes);
app.use('/api/reports',     reportRoutes);
app.use('/api/sessions',    pollJoinLimiter, sessionRoutes);

// New SaaS routes
app.use('/api/universities', universityRoutes);
app.use('/api/analytics',    analyticsSummaryRoutes); // NEW: /api/analytics/summary
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/students',     studentRoutes);
app.use('/api/student',      studentActivityRoutes); // NEW: activity + block
app.use('/api/poll-timer',   pollTimerRoutes);       // NEW: poll timer start/auto-submit

// === v6 Business Features (additive only) ===
const planRoutes              = require('./routes/plans');
const subscriptionRoutes      = require('./routes/subscriptions');
const adminRoutes             = require('./routes/admin');
const questionBankRoutes      = require('./routes/questionBank');
const scheduledSessionRoutes  = require('./routes/scheduledSessions');
const notificationRoutes      = require('./routes/notifications');
const aiInsightRoutes         = require('./routes/aiInsights');
const { seedPlans }           = require('./utils/seedPlans');
const { startScheduledSessionCron } = require('./jobs/scheduledSessionCron');

app.use('/api/plans',               planRoutes);
app.use('/api/subscriptions',       subscriptionRoutes);
app.use('/api/admin',               adminRoutes);
app.use('/api/question-bank',       questionBankRoutes);
app.use('/api/scheduled-sessions',  scheduledSessionRoutes);
app.use('/api/notifications',       notificationRoutes);
app.use('/api/ai-insights',         aiInsightRoutes);
const quizFromFileRoutes = require('./routes/quizFromFile'); // v8: quiz from local file
app.use('/api/quiz/from-file',      quizFromFileRoutes);
const questionsRoutes = require('./routes/questions');      // v9: /api/questions/topics
app.use('/api/questions',           questionsRoutes);

app.use((err, _req, res, _next) => {
  // Handle malformed JSON body
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  console.error('[error]', err.stack || err.message || err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const server = http.createServer(app);
initSocket(server, { clientOrigin: CLIENT_ORIGIN });

// Connect to MongoDB, then start server
connectDB().then(async () => {
  await seedPlans();
  startScheduledSessionCron();
  server.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════════╗
  ║   EDUSCOPE SaaS v3 server (MongoDB)          ║
  ║   http://localhost:${PORT}                       ║
  ║   Multi-university analytics platform        ║
  ╚══════════════════════════════════════════════╝
    `);
  });
}).catch((err) => {
  console.error('[startup] Failed to connect DB:', err.message);
  process.exit(1);
});
