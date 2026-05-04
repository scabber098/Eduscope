// === FILE: server/controllers/universityController.js (MongoDB) ===
const University = require('../models/University');
const Department = require('../models/Department');
const User = require('../models/User');
const Session = require('../models/Session');
const Response = require('../models/Response');
const Poll = require('../models/Poll');

async function listUniversities(req, res) {
  try {
    const unis = await University.find({ active: true }).sort({ name: 1 }).lean();
    const result = [];
    for (const u of unis) {
      const deptCount = await Department.countDocuments({ university_id: u._id });
      const facultyCount = await User.countDocuments({ university_id: u._id, role: 'faculty' });
      result.push({ ...u, id: u._id.toString(), dept_count: deptCount, faculty_count: facultyCount });
    }
    res.json(result);
  } catch (err) { console.error('[uni] list error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function getDepartments(req, res) {
  try {
    const { universityId } = req.params;
    const uni = await University.findById(universityId);
    if (!uni) return res.status(404).json({ error: 'University not found' });
    const rows = await Department.find({ university_id: universityId }).sort({ name: 1 }).lean();
    res.json(rows.map(d => ({ id: d._id.toString(), name: d.name })));
  } catch (err) { console.error('[uni] depts error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function getUniversity(req, res) {
  try {
    const { universityId } = req.params;
    const uni = await University.findById(universityId).lean();
    if (!uni) return res.status(404).json({ error: 'University not found' });

    const depts = await Department.find({ university_id: universityId }).sort({ name: 1 }).lean();
    const facultyCount = await User.countDocuments({ university_id: universityId, role: 'faculty' });
    const studentCount = await User.countDocuments({ university_id: universityId, role: 'student' });
    const sessionCount = await Session.countDocuments({ university_id: universityId });

    res.json({
      ...uni, id: uni._id.toString(),
      departments: depts.map(d => ({ ...d, id: d._id.toString() })),
      faculty_count: facultyCount, student_count: studentCount, session_count: sessionCount,
    });
  } catch (err) { console.error('[uni] get error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function universityLeaderboard(req, res) {
  try {
    const unis = await University.find({ active: true }).lean();
    const rows = [];

    for (const u of unis) {
      const studentCount = await User.countDocuments({ university_id: u._id, role: 'student' });
      const sessionCount = await Session.countDocuments({ university_id: u._id });
      const students = await User.find({ university_id: u._id, role: 'student' }).select('_id').lean();
      const studentIds = students.map(s => s._id);

      let totalAnswered = 0, totalCorrect = 0, totalScored = 0;
      if (studentIds.length > 0) {
        const responses = await Response.find({ student_id: { $in: studentIds } }).select('answer_index poll_id').lean();
        totalAnswered = responses.length;
        for (const r of responses) {
          const poll = await Poll.findById(r.poll_id).select('correct_index').lean();
          if (poll?.correct_index != null) {
            totalScored++;
            if (r.answer_index === poll.correct_index) totalCorrect++;
          }
        }
      }

      const avgAccuracy = totalScored > 0 ? Math.round((totalCorrect / totalScored) * 100) : 0;
      rows.push({
        id: u._id.toString(), name: u.name, short_name: u.short_name, city: u.city,
        student_count: studentCount, session_count: sessionCount,
        total_responses: totalAnswered, avg_accuracy: avgAccuracy,
        score: Math.round(totalAnswered * 0.3 + avgAccuracy * 0.7),
      });
    }

    rows.sort((a, b) => b.score - a.score);
    rows.forEach((r, i) => { r.rank = i + 1; });
    res.json(rows);
  } catch (err) { console.error('[uni] leaderboard error:', err); res.status(500).json({ error: 'Server error' }); }
}

module.exports = { listUniversities, getDepartments, getUniversity, universityLeaderboard };
