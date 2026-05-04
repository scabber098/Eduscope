// === FILE: server/controllers/lectureController.js (MongoDB) ===
const Lecture = require('../models/Lecture');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const User = require('../models/User');

async function listLectures(req, res) {
  try {
    let lectures;
    if (req.user.role === 'faculty') {
      lectures = await Lecture.find({ faculty_id: req.user.id }).sort({ created_at: -1 }).lean();
    } else {
      lectures = await Lecture.find({ archived: false }).sort({ created_at: -1 }).lean();
    }

    const studentCount = (await User.countDocuments({ role: 'student' })) || 1;

    const result = [];
    for (const l of lectures) {
      const polls = await Poll.find({ lecture_id: l._id }).select('_id').lean();
      let avg = 0;
      if (polls.length > 0) {
        const pollIds = polls.map(p => p._id);
        const totalResp = await Response.countDocuments({ poll_id: { $in: pollIds } });
        avg = Math.round((totalResp / (polls.length * studentCount)) * 100);
      }
      result.push({
        ...l, id: l._id.toString(),
        poll_count: polls.length,
        participation_rate: avg,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('[lecture] list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function createLecture(req, res) {
  try {
    const { name } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: 'Lecture name required' });

    const lecture = await Lecture.create({
      name: name.trim(),
      faculty_id: req.user.id,
      archived: false,
      created_at: Date.now(),
    });

    res.json({ ...lecture.toObject(), id: lecture._id.toString(), poll_count: 0, participation_rate: 0 });
  } catch (err) {
    console.error('[lecture] create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function deleteLecture(req, res) {
  try {
    const { id } = req.params;
    const lec = await Lecture.findById(id);
    if (!lec) return res.status(404).json({ error: 'Lecture not found' });
    if (lec.faculty_id.toString() !== req.user.id) return res.status(403).json({ error: 'Not your lecture' });

    await Lecture.updateOne({ _id: id }, { archived: true });
    res.json({ ok: true });
  } catch (err) {
    console.error('[lecture] delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { listLectures, createLecture, deleteLecture };
