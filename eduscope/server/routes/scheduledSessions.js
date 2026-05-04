const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const {
  createScheduled, listScheduled, editScheduled, deleteScheduled, submitAttempt, getResult
} = require('../controllers/scheduledSessionController');

const facultyOnly = [authRequired, requireRole('faculty')];
const studentOnly = [authRequired, requireRole('student')];

// Faculty routes
router.post('/',        ...facultyOnly, createScheduled);
router.get('/',         ...facultyOnly, listScheduled);
router.patch('/:id',    ...facultyOnly, editScheduled);
router.delete('/:id',   ...facultyOnly, deleteScheduled);

// Student routes
router.post('/:id/attempt', ...studentOnly, submitAttempt);
router.get('/:id/result',   ...studentOnly, getResult);

module.exports = router;
