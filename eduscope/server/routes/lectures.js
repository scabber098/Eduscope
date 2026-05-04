// === FILE: server/routes/lectures.js ===
const express = require('express');
const { authRequired, requireRole } = require('../middleware/auth');
const { listLectures, createLecture, deleteLecture } = require('../controllers/lectureController');

const router = express.Router();
router.get('/',     authRequired, listLectures);
router.post('/',    authRequired, requireRole('faculty'), createLecture);
router.delete('/:id', authRequired, requireRole('faculty'), deleteLecture);

module.exports = router;
