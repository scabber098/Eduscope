// === FILE: server/controllers/analyticsController.js (MongoDB) ===
const User = require('../models/User');
const Session = require('../models/Session');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const Department = require('../models/Department');
const University = require('../models/University');
const SessionParticipant = require('../models/SessionParticipant');

// helpers
async function calcAccuracy(pollId, correctIndex) {
  if (correctIndex == null) return null;
  const rs = await Response.find({ poll_id: pollId }).select('answer_index').lean();
  if (rs.length === 0) return null;
  const correct = rs.filter(r => r.answer_index === correctIndex).length;
  return Math.round((correct / rs.length) * 100);
}

async function topicStatsFromPolls(polls) {
  const map = {};
  for (const p of polls) {
    const rs = await Response.find({ poll_id: p._id }).select('answer_index').lean();
    if (rs.length === 0 || p.correct_index == null) continue;
    const correct = rs.filter(r => r.answer_index === p.correct_index).length;
    const cr = Math.round((correct / rs.length) * 100);
    (p.tags || []).forEach(t => {
      if (!map[t]) map[t] = { tag: t, polls: 0, totalCorrect: 0 };
      map[t].polls++;
      map[t].totalCorrect += cr;
    });
  }
  return Object.values(map).map(t => ({
    tag: t.tag, polls: t.polls, avg_correct: Math.round(t.totalCorrect / t.polls),
  })).sort((a, b) => a.avg_correct - b.avg_correct);
}

async function pollAnalytics(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.faculty_id.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const polls = await Poll.find({ session_id: sessionId }).sort({ question_index: 1 }).lean();
    const result = [];

    for (const p of polls) {
      const rs = await Response.find({ poll_id: p._id }).select('answer_index created_at').sort({ created_at: 1 }).lean();
      const distribution = new Array(p.options.length).fill(0);
      rs.forEach(r => { if (r.answer_index >= 0 && r.answer_index < distribution.length) distribution[r.answer_index]++; });

      const timeline = [];
      if (rs.length > 0) {
        const start = rs[0].created_at;
        const end = p.closed_at || Date.now();
        const bucketMs = Math.max(10000, Math.ceil((end - start) / 20) * 1000);
        for (let t = start; t <= end; t += bucketMs) {
          const count = rs.filter(r => r.created_at >= t && r.created_at < t + bucketMs).length;
          timeline.push({ t: Math.round((t - start) / 1000), count });
        }
      }

      const accuracy = p.correct_index != null && rs.length > 0
        ? Math.round(rs.filter(r => r.answer_index === p.correct_index).length / rs.length * 100) : null;

      result.push({
        poll_id: p._id.toString(), question: p.question, options: p.options, tags: p.tags,
        correct_index: p.correct_index, total_responses: rs.length, distribution, accuracy, timeline,
        struggled: p.correct_index != null && rs.length > 0 && accuracy < 60,
      });
    }

    res.json({ session_id: sessionId, title: session.title, created_at: session.created_at, polls: result });
  } catch (err) { console.error('[analytics] pollAnalytics error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function facultyAnalytics(req, res) {
  try {
    const facultyId = req.user.id;
    const totalSessions = await Session.countDocuments({ faculty_id: facultyId });

    const sessionIds = (await Session.find({ faculty_id: facultyId }).select('_id').lean()).map(s => s._id);
    const totalStudents = await SessionParticipant.distinct('student_id', { session_id: { $in: sessionIds }, student_id: { $ne: null } });

    const allPolls = await Poll.find({ session_id: { $in: sessionIds } }).lean();
    const weakTopics = await topicStatsFromPolls(allPolls.filter(p => p.correct_index != null));

    const sessions = await Session.find({ faculty_id: facultyId }).sort({ created_at: -1 }).limit(10).lean();
    const recentSessions = [];
    for (const s of sessions) {
      const participants = await SessionParticipant.countDocuments({ session_id: s._id });
      const pollCount = await Poll.countDocuments({ session_id: s._id });
      recentSessions.push({ id: s._id.toString(), title: s.title, created_at: s.created_at, participants, poll_count: pollCount });
    }

    res.json({
      total_sessions: totalSessions, total_students: totalStudents.length,
      total_polls: allPolls.length, weak_topics: weakTopics, recent_sessions: recentSessions,
    });
  } catch (err) { console.error('[analytics] faculty error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function universityAnalytics(req, res) {
  try {
    const { universityId } = req.params;
    const uni = await University.findById(universityId).lean();
    if (!uni) return res.status(404).json({ error: 'University not found' });
    if (req.user.university_id !== universityId) return res.status(403).json({ error: 'Forbidden' });

    const depts = await Department.find({ university_id: universityId }).lean();
    const deptStats = [];

    for (const d of depts) {
      const facultyCount = await User.countDocuments({ department_id: d._id, role: 'faculty' });
      const studentCount = await User.countDocuments({ department_id: d._id, role: 'student' });
      const sessionCount = await Session.countDocuments({ department_id: d._id });
      const sessionIds = (await Session.find({ department_id: d._id }).select('_id').lean()).map(s => s._id);
      const pollCount = await Poll.countDocuments({ session_id: { $in: sessionIds } });
      const polls = await Poll.find({ session_id: { $in: sessionIds }, correct_index: { $ne: null } }).lean();
      const weak = (await topicStatsFromPolls(polls)).slice(0, 3);

      deptStats.push({
        department_id: d._id.toString(), department_name: d.name,
        faculty_count: facultyCount, student_count: studentCount,
        session_count: sessionCount, poll_count: pollCount, weak_topics: weak,
      });
    }

    const totalFaculty = await User.countDocuments({ university_id: universityId, role: 'faculty' });
    const totalStudents = await User.countDocuments({ university_id: universityId, role: 'student' });
    const totalSessions = await Session.countDocuments({ university_id: universityId });

    res.json({
      university: { id: uni._id.toString(), name: uni.name, short_name: uni.short_name, city: uni.city },
      total_faculty: totalFaculty, total_students: totalStudents, total_sessions: totalSessions, departments: deptStats,
    });
  } catch (err) { console.error('[analytics] university error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function leaderboard(req, res) {
  try {
    const { universityId, departmentId } = req.query;
    const filter = { role: 'student' };
    if (universityId) filter.university_id = universityId;
    if (departmentId) filter.department_id = departmentId;

    const students = await User.find(filter).select('name department_id').lean();
    const totalPolls = (await Poll.countDocuments({ status: 'closed' })) || 1;

    const rows = [];
    for (const s of students) {
      const rs = await Response.find({ student_id: s._id }).select('answer_index poll_id').lean();
      let correct = 0, scored = 0;
      for (const r of rs) {
        const poll = await Poll.findById(r.poll_id).select('correct_index').lean();
        if (poll?.correct_index != null) { scored++; if (r.answer_index === poll.correct_index) correct++; }
      }
      const accuracy = scored ? Math.round((correct / scored) * 100) : 0;
      const score = Math.round((rs.length / totalPolls) * 50 + accuracy * 0.5);
      const dept = s.department_id ? await Department.findById(s.department_id).select('name').lean() : null;
      rows.push({ id: s._id.toString(), name: s.name, answered: rs.length, accuracy, score, department: dept?.name || null });
    }

    rows.sort((a, b) => b.score - a.score || b.accuracy - a.accuracy);
    rows.forEach((r, i) => { r.rank = i + 1; });

    const myId = req.user?.id;
    const myIdx = rows.findIndex(r => r.id === myId);
    const top20 = rows.slice(0, 20);
    if (myIdx >= 20) top20.push(rows[myIdx]);
    res.json(top20);
  } catch (err) { console.error('[analytics] leaderboard error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function weakTopics(req, res) {
  try {
    const facultyId = req.user.id;
    const sessionIds = (await Session.find({ faculty_id: facultyId }).select('_id').lean()).map(s => s._id);
    const allPolls = await Poll.find({ session_id: { $in: sessionIds }, correct_index: { $ne: null } }).lean();
    res.json(await topicStatsFromPolls(allPolls));
  } catch (err) { console.error('[analytics] weakTopics error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function studentProfile(req, res) {
  try {
    const { studentId } = req.params;
    const student = await User.findOne({ _id: studentId, role: 'student' }).select('name email university_id department_id').lean();
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const uni = student.university_id ? await University.findById(student.university_id).select('name short_name').lean() : null;
    const dept = student.department_id ? await Department.findById(student.department_id).select('name').lean() : null;

    const responses = await Response.find({ student_id: studentId }).sort({ created_at: -1 }).lean();
    const history = [];
    for (const r of responses) {
      const poll = await Poll.findById(r.poll_id).lean();
      if (!poll) continue;
      const session = await Session.findById(poll.session_id).select('title created_at').lean();
      history.push({
        answer_index: r.answer_index, created_at: r.created_at,
        question: poll.question, options: poll.options, correct_index: poll.correct_index, tags: poll.tags,
        session_title: session?.title || '', session_date: session?.created_at,
        correct: poll.correct_index != null ? r.answer_index === poll.correct_index : null,
      });
    }

    const scored = history.filter(r => r.correct !== null);
    const accuracy = scored.length ? Math.round(scored.filter(r => r.correct).length / scored.length * 100) : 0;

    const tagMap = {};
    history.forEach(r => {
      (r.tags || []).forEach(t => {
        if (!tagMap[t]) tagMap[t] = { tag: t, total: 0, correct: 0 };
        tagMap[t].total++;
        if (r.correct) tagMap[t].correct++;
      });
    });
    const studentWeakTopics = Object.values(tagMap).map(t => ({ tag: t.tag, total: t.total, accuracy: Math.round(t.correct / t.total * 100) })).sort((a, b) => a.accuracy - b.accuracy);

    const participantRecords = await SessionParticipant.find({ student_id: studentId }).lean();
    const sessions = [];
    for (const sp of participantRecords) {
      const s = await Session.findById(sp.session_id).select('title created_at').lean();
      const totalPollsInSession = await Poll.countDocuments({ session_id: sp.session_id });
      const pollIds = (await Poll.find({ session_id: sp.session_id }).select('_id').lean()).map(p => p._id);
      const pollsAnswered = await Response.countDocuments({ student_id: studentId, poll_id: { $in: pollIds } });
      sessions.push({ id: sp.session_id.toString(), title: s?.title || '', created_at: s?.created_at, polls_answered: pollsAnswered, total_polls: totalPollsInSession });
    }

    res.json({
      student: { ...student, id: student._id.toString(), university: uni, department: dept },
      stats: { total_answered: history.length, accuracy },
      weak_topics: studentWeakTopics, sessions,
      history: history.slice(0, 50),
    });
  } catch (err) { console.error('[analytics] studentProfile error:', err); res.status(500).json({ error: 'Server error' }); }
}

async function disqualified(req, res) {
  try {
    const facultyId = req.user.id;
    const { sessionId } = req.query;

    let filter;
    if (sessionId) {
      const session = await Session.findOne({ _id: sessionId, faculty_id: facultyId });
      if (!session) return res.json([]);
      filter = { session_id: sessionId, status: 'disqualified' };
    } else {
      const sessionIds = (await Session.find({ faculty_id: facultyId }).select('_id').lean()).map(s => s._id);
      filter = { session_id: { $in: sessionIds }, status: 'disqualified' };
    }

    const rows = await SessionParticipant.find(filter).sort({ joined_at: -1 }).lean();
    const result = [];
    for (const r of rows) {
      const s = await Session.findById(r.session_id).select('title created_at').lean();
      result.push({ ...r, id: r._id.toString(), session_title: s?.title || '', session_date: s?.created_at });
    }
    res.json(result);
  } catch (err) { console.error('[analytics] disqualified error:', err); res.status(500).json({ error: 'Server error' }); }
}

module.exports = { pollAnalytics, facultyAnalytics, universityAnalytics, leaderboard, weakTopics, studentProfile, disqualified };
