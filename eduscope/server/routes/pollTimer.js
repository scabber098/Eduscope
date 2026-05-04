// NEW FILE: server/routes/pollTimer.js
// Manages per-student poll start times and auto-submit on expiry
// Does NOT modify any existing route or controller
const express = require('express');
const Poll = require('../models/Poll');
const PollSession = require('../models/PollSession');
const Response = require('../models/Response');
const { authRequired, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// POST /api/poll-timer/:pollId/start
// Called when student opens a timed poll; records startTime
router.post('/:pollId/start', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { pollId } = req.params;
    const studentId = req.user.id;

    const poll = await Poll.findById(pollId).lean();
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.status === 'closed') return res.status(400).json({ error: 'Poll is closed' });

    // Upsert: if already started, return existing startTime
    let ps = await PollSession.findOne({ pollId, studentId });
    if (!ps) {
      ps = await PollSession.create({ pollId, studentId, startTime: Date.now() });
    }

    const timeElapsedMs = Date.now() - ps.startTime;
    const durationMs = poll.duration ? poll.duration * 60 * 1000 : null;
    const timeRemainingMs = durationMs ? Math.max(0, durationMs - timeElapsedMs) : null;
    const expired = durationMs !== null && timeElapsedMs >= durationMs;

    res.json({
      pollId,
      startTime: ps.startTime,
      duration: poll.duration,
      timeRemainingMs,
      expired,
    });
  } catch (err) {
    console.error('[poll-timer] start error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/poll-timer/:pollId/auto-submit
// Called by client when timer expires; auto-submits with whatever answer was selected (or -1)
router.post('/:pollId/auto-submit', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { pollId } = req.params;
    const studentId = req.user.id;
    const { answerIndex = -1 } = req.body;

    const poll = await Poll.findById(pollId).lean();
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const ps = await PollSession.findOne({ pollId, studentId });
    if (!ps) return res.status(400).json({ error: 'Poll not started for this student' });
    if (ps.submitted) return res.json({ ok: true, alreadySubmitted: true });

    // Verify timer actually expired
    if (poll.duration) {
      const elapsed = Date.now() - ps.startTime;
      const durationMs = poll.duration * 60 * 1000;
      if (elapsed < durationMs) {
        return res.status(400).json({ error: 'Timer has not expired yet' });
      }
    }

    // Mark submitted
    await PollSession.findByIdAndUpdate(ps._id, { submitted: true, autoSubmitted: true });

    // Only write Response if a real answer was given and no response exists yet
    if (answerIndex >= 0) {
      const existing = await Response.findOne({ poll_id: pollId, student_id: studentId });
      if (!existing) {
        await Response.create({
          poll_id: pollId,
          student_id: studentId,
          answer_index: answerIndex,
          created_at: Date.now(),
        });
      }
    }

    await logAudit({
      userId: studentId,
      action: 'POLL_SUBMITTED',
      metadata: { pollId, autoSubmitted: true, answerIndex },
    });

    console.log(`[poll-timer] auto-submitted pollId=${pollId} studentId=${studentId} answer=${answerIndex}`);
    res.json({ ok: true, autoSubmitted: true });
  } catch (err) {
    console.error('[poll-timer] auto-submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
