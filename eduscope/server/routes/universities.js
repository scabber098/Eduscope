// === FILE: server/routes/universities.js ===
const express = require('express');
const { listUniversities, getDepartments, getUniversity, universityLeaderboard } = require('../controllers/universityController');

const router = express.Router();

router.get('/',                            listUniversities);           // GET /api/universities
router.get('/leaderboard',                 universityLeaderboard);      // GET /api/universities/leaderboard (NEW)
router.get('/:universityId',               getUniversity);              // GET /api/universities/:id
router.get('/:universityId/departments',   getDepartments);             // GET /api/universities/:id/departments

module.exports = router;
