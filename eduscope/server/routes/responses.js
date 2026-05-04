// === FILE: server/routes/responses.js ===
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { submitResponse, myHistory } = require('../controllers/responseController');

const router = express.Router();
router.post('/',    authRequired, requireRole('student'), submitResponse);
router.get('/me',   authRequired, requireRole('student'), myHistory);

module.exports = router;
