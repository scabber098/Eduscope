// === FILE: server/routes/sessions.js ===
const express = require('express');
const { authRequired, requireRole, optionalAuth } = require('../middleware/auth');
const {
  createSession, joinSession, reportTabSwitch, submitSessionAnswer,
  getSessionLive, closeSession, listSessions, checkSession, validateParticipant,
} = require('../controllers/sessionController');

const router = express.Router();

router.post('/',                  authRequired, requireRole('faculty'), createSession);
router.get('/',                   authRequired, requireRole('faculty'), listSessions);
router.post('/join',              optionalAuth, joinSession);
router.get('/check/:code',       checkSession);                                        // NEW: lightweight code check
router.get('/:sessionId/validate/:participantId', validateParticipant);                // NEW: reconnect validation
router.post('/tab-switch',        reportTabSwitch);
router.post('/answer',            submitSessionAnswer);
router.get('/:sessionId/live',    authRequired, requireRole('faculty'), getSessionLive);
router.patch('/:sessionId/close', authRequired, requireRole('faculty'), closeSession);

module.exports = router;
