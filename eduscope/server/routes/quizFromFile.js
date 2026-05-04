// routes/quizFromFile.js
// NEW — additive only. Mounts at /api/quiz/from-file
const router   = require('express').Router();
const { authRequired, requireRole } = require('../middleware/auth');
const { getMeta, generateFromFile, getTopics } = require('../controllers/quizFromFileController');

const facultyOnly = [authRequired, requireRole('faculty')];

router.get('/meta',   ...facultyOnly, getMeta);
router.post('/',      ...facultyOnly, generateFromFile);

module.exports = router;
