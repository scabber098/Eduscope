// routes/questions.js — GET /api/questions/topics
const router = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const { getTopics } = require('../controllers/quizFromFileController');

router.get('/topics', authRequired, requireRole('faculty'), getTopics);

module.exports = router;
