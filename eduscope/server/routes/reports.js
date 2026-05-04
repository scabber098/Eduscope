// === FILE: server/routes/reports.js ===
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const {
  lectureReport,
  facultyDashboard,
  studentDashboard,
  leaderboard,
  listStudents,
  studentDetail,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/faculty/dashboard', authRequired, requireRole('faculty'), facultyDashboard);
router.get('/faculty/students',  authRequired, requireRole('faculty'), listStudents);
router.get('/faculty/students/:id', authRequired, requireRole('faculty'), studentDetail);

router.get('/student/dashboard', authRequired, requireRole('student'), studentDashboard);
router.get('/leaderboard',       authRequired, leaderboard);

router.get('/:lectureId', authRequired, requireRole('faculty'), lectureReport);

module.exports = router;
