// === FILE: server/controllers/reportController.js (MongoDB) ===
const User = require('../models/User');
const Lecture = require('../models/Lecture');
const Poll = require('../models/Poll');
const Response = require('../models/Response');

async function lectureReport(req, res) {
  try {
    const { lectureId } = req.params;
    const lecture = await Lecture.findById(lectureId).lean();
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });

    const studentCount = (await User.countDocuments({ role: 'student' })) || 1;
    const polls = await Poll.find({ lecture_id: lectureId }).sort({ created_at: 1 }).lean();

    const pollReports = [];
    for (const p of polls) {
      const responses = await Response.find({ poll_id: p._id }).select('answer_index').lean();
      const counts = new Array(p.options.length).fill(0);
      responses.forEach(r => { if (r.answer_index >= 0 && r.answer_index < counts.length) counts[r.answer_index]++; });

      const correctCount = p.correct_index != null ? responses.filter(r => r.answer_index === p.correct_index).length : 0;
      const participationRate = Math.round((responses.length / studentCount) * 100);
      const correctRate = responses.length ? Math.round((correctCount / responses.length) * 100) : 0;

      pollReports.push({
        id: p._id.toString(), question: p.question, options: p.options, tags: p.tags,
        correct_index: p.correct_index, total_responses: responses.length,
        participation_rate: participationRate, correct_rate: correctRate,
        option_counts: counts,
        struggled: p.correct_index != null && responses.length > 0 && correctRate < 60,
      });
    }

    const avgParticipation = pollReports.length
      ? Math.round(pollReports.reduce((s, p) => s + p.participation_rate, 0) / pollReports.length) : 0;

    const topicMap = {};
    pollReports.forEach(p => {
      p.tags.forEach(t => {
        if (!topicMap[t]) topicMap[t] = { tag: t, polls: 0, correctSum: 0 };
        topicMap[t].polls += 1;
        topicMap[t].correctSum += p.correct_rate;
      });
    });
    const topics = Object.values(topicMap).map(t => ({ tag: t.tag, polls: t.polls, avg_correct: Math.round(t.correctSum / t.polls) }));

    res.json({ lecture: { id: lecture._id.toString(), name: lecture.name }, avg_participation: avgParticipation, total_polls: pollReports.length, polls: pollReports, topics });
  } catch (err) { console.error('[report] lectureReport error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function facultyDashboard(req, res) {
  try {
    const facultyId = req.user.id;
    const studentCount = (await User.countDocuments({ role: 'student' })) || 1;
    const lectures = await Lecture.find({ faculty_id: facultyId, archived: false }).sort({ created_at: -1 }).lean();
    const totalPolls = await Poll.countDocuments({ lecture_id: { $in: lectures.map(l => l._id) } });

    const perLecture = [];
    for (const l of lectures.slice(0, 10)) {
      const polls = await Poll.find({ lecture_id: l._id }).select('_id').lean();
      if (polls.length === 0) { perLecture.push({ lecture: l.name, rate: 0 }); continue; }
      const total = await Response.countDocuments({ poll_id: { $in: polls.map(p => p._id) } });
      perLecture.push({ lecture: l.name, rate: Math.round((total / (polls.length * studentCount)) * 100) });
    }
    perLecture.reverse();

    const avgParticipation = perLecture.length ? Math.round(perLecture.reduce((s, l) => s + l.rate, 0) / perLecture.length) : 0;

    const allPolls = await Poll.find({ lecture_id: { $in: lectures.map(l => l._id) }, correct_index: { $ne: null } }).lean();
    const topicStats = {};
    for (const p of allPolls) {
      const responses = await Response.find({ poll_id: p._id }).select('answer_index').lean();
      if (responses.length === 0) continue;
      const correct = responses.filter(r => r.answer_index === p.correct_index).length;
      const rate = (correct / responses.length) * 100;
      p.tags.forEach(t => {
        if (!topicStats[t]) topicStats[t] = { tag: t, count: 0, sum: 0 };
        topicStats[t].count += 1;
        topicStats[t].sum += rate;
      });
    }
    const topics = Object.values(topicStats).map(t => ({ tag: t.tag, avg_correct: Math.round(t.sum / t.count) })).sort((a, b) => a.avg_correct - b.avg_correct);

    res.json({
      total_lectures: lectures.length, total_polls: totalPolls, avg_participation: avgParticipation,
      most_struggled_topic: topics[0] || null, participation_per_lecture: perLecture, topics,
      recent_lectures: lectures.slice(0, 5).map(l => ({ id: l._id.toString(), name: l.name, created_at: l.created_at })),
    });
  } catch (err) { console.error('[report] facultyDashboard error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function studentDashboard(req, res) {
  try {
    const studentId = req.user.id;
    const totalPolls = await Poll.countDocuments({ lecture_id: { $in: (await Lecture.find({ archived: false }).select('_id').lean()).map(l => l._id) } });

    const responses = await Response.find({ student_id: studentId }).sort({ created_at: 1 }).lean();
    const participationRate = totalPolls ? Math.round((responses.length / totalPolls) * 100) : 0;

    // Enrich with correct_index
    const enriched = [];
    for (const r of responses) {
      const poll = await Poll.findById(r.poll_id).select('correct_index created_at').lean();
      enriched.push({ ...r, correct_index: poll?.correct_index ?? null, poll_created: poll?.created_at });
    }

    const correct = enriched.filter(r => r.correct_index != null && r.answer_index === r.correct_index).length;
    const scored = enriched.filter(r => r.correct_index != null).length;
    const accuracy = scored ? Math.round((correct / scored) * 100) : 0;

    const streak = (await Response.distinct('poll_id', { student_id: studentId })).length > 0
      ? (await Poll.distinct('lecture_id', { _id: { $in: await Response.distinct('poll_id', { student_id: studentId }) } })).length : 0;

    const recent = enriched.filter(r => r.correct_index != null).slice(-10).map((r, i) => ({ idx: i + 1, correct: r.answer_index === r.correct_index ? 1 : 0 }));

    res.json({ participation_rate: participationRate, total_answered: responses.length, total_polls: totalPolls, accuracy, streak, performance: recent });
  } catch (err) { console.error('[report] studentDashboard error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function leaderboard(req, res) {
  try {
    const students = await User.find({ role: 'student' }).select('name').lean();
    const totalPolls = (await Poll.countDocuments({ lecture_id: { $in: (await Lecture.find({ archived: false }).select('_id').lean()).map(l => l._id) } })) || 1;

    const rows = [];
    for (const s of students) {
      const answered = await Response.countDocuments({ student_id: s._id });
      rows.push({ id: s._id.toString(), name: s.name, answered, rate: Math.round((answered / totalPolls) * 100) });
    }

    rows.sort((a, b) => b.rate - a.rate || b.answered - a.answered);
    rows.forEach((r, i) => { r.rank = i + 1; });

    const myIdx = rows.findIndex(r => r.id === req.user.id);
    const top10 = rows.slice(0, 10);
    if (myIdx >= 10) top10.push(rows[myIdx]);
    res.json(top10);
  } catch (err) { console.error('[report] leaderboard error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function listStudents(req, res) {
  try {
    const students = await User.find({ role: 'student' }).select('name email').lean();
    const totalPolls = (await Poll.countDocuments({ lecture_id: { $in: (await Lecture.find({ archived: false }).select('_id').lean()).map(l => l._id) } })) || 1;

    const out = [];
    for (const s of students) {
      const rs = await Response.find({ student_id: s._id }).sort({ created_at: 1 }).lean();
      const enriched = [];
      for (const r of rs) {
        const poll = await Poll.findById(r.poll_id).select('correct_index').lean();
        enriched.push({ ...r, correct_index: poll?.correct_index ?? null });
      }

      const last = rs.length ? rs[rs.length - 1].created_at : null;
      const rate = Math.round((rs.length / totalPolls) * 100);
      const scored = enriched.filter(r => r.correct_index != null);
      const correctCount = scored.filter(r => r.answer_index === r.correct_index).length;
      const accuracy = scored.length ? Math.round((correctCount / scored.length) * 100) : 0;

      const half = Math.floor(rs.length / 2);
      const trend = rs.slice(half).length > rs.slice(0, half).length ? 'up' : rs.slice(half).length < rs.slice(0, half).length ? 'down' : 'flat';

      out.push({ id: s._id.toString(), name: s.name, email: s.email, participation_rate: rate, accuracy, last_active: last, trend, total_answered: rs.length });
    }

    res.json(out.sort((a, b) => b.participation_rate - a.participation_rate));
  } catch (err) { console.error('[report] listStudents error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function studentDetail(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, role: 'student' }).select('name email').lean();
    if (!user) return res.status(404).json({ error: 'Student not found' });

    const responses = await Response.find({ student_id: id }).sort({ created_at: -1 }).lean();
    const history = [];
    for (const r of responses) {
      const poll = await Poll.findById(r.poll_id).lean();
      if (!poll) continue;
      const lecture = await Lecture.findById(poll.lecture_id).select('name').lean();
      history.push({
        ...r, poll_id: poll._id.toString(), question: poll.question,
        options: poll.options, correct_index: poll.correct_index,
        lecture_name: lecture?.name || '',
        correct: poll.correct_index != null ? r.answer_index === poll.correct_index : null,
      });
    }

    res.json({ user: { ...user, id: user._id.toString() }, history });
  } catch (err) { console.error('[report] studentDetail error:', err); res.status(500).json({ error: 'Server error' }); }
}

module.exports = { lectureReport, facultyDashboard, studentDashboard, leaderboard, listStudents, studentDetail };
