// === FILE: server/controllers/pollController.js (MongoDB) ===
const Poll = require('../models/Poll');
const Lecture = require('../models/Lecture');
const Response = require('../models/Response');
const { getIO } = require('../socket');

async function createPoll(req, res) {
  try {
    const { lectureId, question, options, correctIndex, timeLimit, tags } = req.body || {};
    if (!lectureId || !question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'lectureId, question and at least 2 options required' });
    }
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
    if (lecture.faculty_id.toString() !== req.user.id) return res.status(403).json({ error: 'Not your lecture' });

    const poll = await Poll.create({
      lecture_id: lectureId,
      session_id: null,
      question: question.trim(),
      options: options.map(o => String(o).trim()).filter(Boolean),
      correct_index: Number.isInteger(correctIndex) ? correctIndex : null,
      tags: Array.isArray(tags) ? tags : [],
      status: 'open',
      created_at: Date.now(),
      closed_at: null,
    });

    const io = getIO();
    if (io) io.to(`lecture:${lectureId}`).emit('poll:open', { poll: poll.toObject() });

    if (timeLimit) {
      setTimeout(async () => {
        const current = await Poll.findById(poll._id).select('status');
        if (current && current.status === 'open') {
          await Poll.updateOne({ _id: poll._id }, { status: 'closed', closed_at: Date.now() });
          const io2 = getIO();
          if (io2) io2.to(`lecture:${lectureId}`).emit('poll:close', { pollId: poll._id.toString() });
        }
      }, timeLimit * 1000);
    }

    res.json({ ...poll.toObject(), id: poll._id.toString() });
  } catch (err) {
    console.error('[poll] create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getPollsForLecture(req, res) {
  try {
    const { lectureId } = req.params;
    const polls = await Poll.find({ lecture_id: lectureId }).sort({ created_at: -1 }).lean();
    res.json(polls.map(p => ({ ...p, id: p._id.toString() })));
  } catch (err) {
    console.error('[poll] list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getActivePollsForStudent(req, res) {
  try {
    const activeLectures = await Lecture.find({ archived: false }).select('_id name').lean();
    const lectureMap = {};
    activeLectures.forEach(l => { lectureMap[l._id.toString()] = l.name; });

    const polls = await Poll.find({
      status: 'open',
      lecture_id: { $in: activeLectures.map(l => l._id) },
    }).sort({ created_at: -1 }).lean();

    const answered = (await Response.find({ student_id: req.user.id }).select('poll_id').lean()).map(r => r.poll_id.toString());

    const result = polls
      .filter(p => !answered.includes(p._id.toString()))
      .map(p => ({ ...p, id: p._id.toString(), lecture_name: lectureMap[p.lecture_id.toString()] || '' }));

    res.json(result);
  } catch (err) {
    console.error('[poll] active error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function closePoll(req, res) {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    const lecture = await Lecture.findById(poll.lecture_id);
    if (!lecture || lecture.faculty_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not your poll' });
    }

    await Poll.updateOne({ _id: id }, { status: 'closed', closed_at: Date.now() });

    const io = getIO();
    if (io) io.to(`lecture:${poll.lecture_id}`).emit('poll:close', { pollId: id });
    res.json({ ok: true });
  } catch (err) {
    console.error('[poll] close error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { createPoll, getPollsForLecture, getActivePollsForStudent, closePoll };
