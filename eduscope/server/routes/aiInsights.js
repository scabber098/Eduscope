const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const { getSessionInsight } = require('../controllers/aiInsightController');
const { getStudentSessionInsight, getStudentHistoryInsight, getFacultySessionInsight } = require('../controllers/studentAiInsightController');

// Existing faculty route (Claude-based)
router.get('/session/:sessionId', authRequired, requireRole('faculty'), getSessionInsight);

// New: Student AI Insights
router.get('/student/session/:sessionId', authRequired, requireRole('student'), getStudentSessionInsight);
router.get('/student/history', authRequired, requireRole('student'), getStudentHistoryInsight);

// New: Faculty class overview AI Insights
router.get('/faculty/session/:sessionId', authRequired, requireRole('faculty'), getFacultySessionInsight);

module.exports = router;
