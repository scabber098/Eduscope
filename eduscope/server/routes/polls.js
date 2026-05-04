// === FILE: server/routes/polls.js ===
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const {
  createPoll,
  getPollsForLecture,
  getActivePollsForStudent,
  closePoll,
} = require('../controllers/pollController');

const router = express.Router();
router.post('/',              authRequired, requireRole('faculty'), createPoll);
router.get('/active/student', authRequired, requireRole('student'), getActivePollsForStudent);
router.get('/:lectureId',     authRequired, getPollsForLecture);
router.patch('/:id/close',    authRequired, requireRole('faculty'), closePoll);

module.exports = router;
