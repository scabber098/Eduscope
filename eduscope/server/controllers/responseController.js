// === FILE: server/controllers/responseController.js ===
const Poll = require('../models/Poll');
const Lecture = require('../models/Lecture');
const Response = require('../models/Response');
const User = require('../models/User');
const { getIO } = require('../socket');

async function submitResponse(req, res) {
  try {
    const { pollId, answerIndex } = req.body || {};
    if (!pollId || !Number.isInteger(answerIndex)) {
      return res.status(400).json({ error: 'pollId and numeric answerIndex required' });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.status !== 'open') return res.status(400).json({ error: 'Poll has been closed' });

    const existing = await Response.findOne({ poll_id: pollId, student_id: req.user.id });
    if (existing) return res.status(409).json({ error: 'Already answered' });

    if (answerIndex < 0 || answerIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid answer index' });
    }

    const isCorrect = poll.correct_index != null
      ? answerIndex === poll.correct_index
      : null;

    // Points: 10 for correct, 1 for participation (no correct_index defined)
    const pointsEarned = isCorrect === true ? 10 : isCorrect === null ? 1 : 0;

    const response = await Response.create({
      poll_id: pollId,
      student_id: req.user.id,
      answer_index: answerIndex,
      created_at: Date.now(),
    });

    // ── MARKS FIX: increment marks on User record ──────────────────────────
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $inc: { marks: pointsEarned } },
      { new: true, upsert: false }
    );
    console.log(
      `[response] ✅ Student ${req.user.id} (${req.user.name}) submitted poll ${pollId}` +
      ` | correct=${isCorrect} | points=${pointsEarned}` +
      ` | new total marks=${updatedUser?.marks ?? 'N/A'}`
    );
    // ───────────────────────────────────────────────────────────────────────

    const counts = new Array(poll.options.length).fill(0);
    const rows = await Response.find({ poll_id: pollId }).select('answer_index').lean();
    rows.forEach(r => { if (r.answer_index >= 0 && r.answer_index < counts.length) counts[r.answer_index]++; });

    const io = getIO();
    if (io) {
      io.to(`lecture:${poll.lecture_id}`).emit('poll:update', {
        pollId: pollId.toString(),
        responseCounts: counts,
        totalResponses: rows.length,
      });
    }

    res.json({
      ok: true,
      response: { ...response.toObject(), id: response._id.toString() },
      correct: isCorrect,
      pointsEarned,
    });
  } catch (err) {
    console.error('[response] submit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function myHistory(req, res) {
  try {
    const responses = await Response.find({ student_id: req.user.id }).sort({ created_at: -1 }).lean();
    const result = [];
    for (const r of responses) {
      const poll = await Poll.findById(r.poll_id).lean();
      if (!poll) continue;
      const lecture = await Lecture.findById(poll.lecture_id).select('name').lean();
      result.push({
        response_id: r._id.toString(),
        poll_id: poll._id.toString(),
        lecture_id: poll.lecture_id.toString(),
        lecture_name: lecture?.name || '',
        question: poll.question,
        options: poll.options,
        tags: poll.tags,
        answer_index: r.answer_index,
        correct_index: poll.correct_index,
        status: poll.status,
        created_at: r.created_at,
        correct: poll.correct_index != null ? r.answer_index === poll.correct_index : null,
      });
    }
    res.json(result);
  } catch (err) {
    console.error('[response] history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { submitResponse, myHistory };
