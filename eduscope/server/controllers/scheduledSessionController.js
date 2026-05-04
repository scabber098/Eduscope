const ScheduledSession = require('../models/ScheduledSession');
const { createNotification } = require('../utils/notify');
const { v4: uuidv4 } = require('uuid');

// POST /api/scheduled-sessions — faculty
async function createScheduled(req, res) {
  try {
    const { lecture_id, title, scheduled_at, duration_minutes, questions, max_attempts } = req.body || {};
    if (!title || !scheduled_at || !duration_minutes || !Array.isArray(questions) || !questions.length) {
      return res.status(400).json({ error: 'title, scheduled_at, duration_minutes, questions required' });
    }

    const qs = questions.filter(q => q.question && Array.isArray(q.options) && q.options.length >= 2)
      .map(q => ({
        question: q.question.trim(),
        options: q.options.map(o => String(o).trim()),
        correct_index: Number.isInteger(q.correct_index) ? q.correct_index : null,
        tags: Array.isArray(q.tags) ? q.tags : [],
      }));

    const ss = await ScheduledSession.create({
      faculty_id: req.user.id,
      university_id: req.user.university_id || null,
      lecture_id: lecture_id || null,
      title: title.trim(),
      scheduled_at: Number(scheduled_at),
      duration_minutes: Number(duration_minutes),
      questions: qs,
      access_code: uuidv4().slice(0, 8).toUpperCase(),
      max_attempts: max_attempts || 1,
      status: 'pending',
    });

    res.status(201).json({ data: ss });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/scheduled-sessions — faculty
async function listScheduled(req, res) {
  try {
    const sessions = await ScheduledSession.find({ faculty_id: req.user.id }).sort({ scheduled_at: -1 });
    res.json({ data: sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/scheduled-sessions/:id — faculty, only if pending
async function editScheduled(req, res) {
  try {
    const ss = await ScheduledSession.findOne({ _id: req.params.id, faculty_id: req.user.id });
    if (!ss) return res.status(404).json({ error: 'Not found' });
    if (ss.status !== 'pending') return res.status(400).json({ error: 'Can only edit pending sessions' });

    const allowed = ['title', 'scheduled_at', 'duration_minutes', 'questions', 'max_attempts'];
    allowed.forEach(k => { if (req.body[k] !== undefined) ss[k] = req.body[k]; });
    await ss.save();
    res.json({ data: ss });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/scheduled-sessions/:id — faculty
async function deleteScheduled(req, res) {
  try {
    const ss = await ScheduledSession.findOneAndDelete({ _id: req.params.id, faculty_id: req.user.id });
    if (!ss) return res.status(404).json({ error: 'Not found' });
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/scheduled-sessions/:id/attempt — student
async function submitAttempt(req, res) {
  try {
    const ss = await ScheduledSession.findById(req.params.id);
    if (!ss) return res.status(404).json({ error: 'Not found' });

    const now = Date.now();
    const expiresAt = ss.scheduled_at + ss.duration_minutes * 60 * 1000;
    if (now < ss.scheduled_at) return res.status(400).json({ error: 'Session not open yet' });
    if (now > expiresAt || ss.status === 'expired') return res.status(400).json({ error: 'Session has expired' });

    const studentId = req.user.id;
    const existingAttempts = ss.attempts.filter(a => a.student_id.toString() === studentId);
    if (existingAttempts.length >= ss.max_attempts) {
      return res.status(400).json({ error: 'Max attempts reached' });
    }

    const { answers } = req.body || {};
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers array required' });

    let score = 0;
    ss.questions.forEach((q, i) => {
      if (q.correct_index !== null && answers[i] === q.correct_index) score++;
    });

    ss.attempts.push({ student_id: studentId, answers, score, total: ss.questions.length, submitted_at: now });
    await ss.save();

    await createNotification(studentId, 'ATTEMPT_RESULT', `Result: ${ss.title}`, `You scored ${score}/${ss.questions.length}.`, { session_id: ss._id, score, total: ss.questions.length });

    res.json({ data: { score, total: ss.questions.length, answers } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/scheduled-sessions/:id/result — student
async function getResult(req, res) {
  try {
    const ss = await ScheduledSession.findById(req.params.id).select('title questions attempts');
    if (!ss) return res.status(404).json({ error: 'Not found' });
    const myAttempts = ss.attempts.filter(a => a.student_id.toString() === req.user.id);
    res.json({ data: { title: ss.title, attempts: myAttempts, total_questions: ss.questions.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { createScheduled, listScheduled, editScheduled, deleteScheduled, submitAttempt, getResult };
