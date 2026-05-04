// === FILE: server/routes/analytics.js ===
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const {
  pollAnalytics,
  facultyAnalytics,
  universityAnalytics,
  leaderboard,
  weakTopics,
  studentProfile,
  disqualified,
} = require('../controllers/analyticsController');

const router = express.Router();

// Faculty routes
router.get('/faculty/summary',            authRequired, requireRole('faculty'), facultyAnalytics);
router.get('/faculty/weak-topics',        authRequired, requireRole('faculty'), weakTopics);
router.get('/faculty/disqualified',       authRequired, requireRole('faculty'), disqualified);
router.get('/faculty/students/:studentId',authRequired, requireRole('faculty'), studentProfile);
router.get('/sessions/:sessionId/polls',  authRequired, requireRole('faculty'), pollAnalytics);

// University-wide (scoped to faculty's own university)
router.get('/university/:universityId',   authRequired, universityAnalytics);

// Shared (student + faculty — filter by ?universityId=&departmentId=)
router.get('/leaderboard',                authRequired, leaderboard);

module.exports = router;
