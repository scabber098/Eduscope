// === FILE: server/controllers/sessionController.js (MongoDB) ===
const Session = require('../models/Session');
const Poll = require('../models/Poll');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const SessionParticipant = require('../models/SessionParticipant');
const Response = require('../models/Response');
const { getIO } = require('../socket');

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function ensureUniqueCode() {
  let code = generateCode();
  let exists = await Session.findOne({ code });
  while (exists) { code = generateCode(); exists = await Session.findOne({ code }); }
  return code;
}

async function createSession(req, res) {
  try {
    const { lectureId, title, questions, timeLimit } = req.body || {};
    if (!lectureId || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'lectureId and at least 1 question required' });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) return res.status(404).json({ error: 'Lecture not found' });
    if (lecture.faculty_id.toString() !== req.user.id) return res.status(403).json({ error: 'Not your lecture' });

    const faculty = await User.findById(req.user.id).select('university_id department_id');
    const code = await ensureUniqueCode();

    const session = await Session.create({
      code,
      lecture_id: lectureId,
      faculty_id: req.user.id,
      title: (title || 'Live Session').trim(),
      status: 'active',
      time_limit: timeLimit || null,
      university_id: faculty?.university_id || null,
      department_id: faculty?.department_id || null,
      created_at: Date.now(),
      closed_at: null,
    });

    const polls = [];
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const opts = (q.options || []).map(o => String(o).trim()).filter(Boolean);
      if (!q.question || opts.length < 2) continue;

      const poll = await Poll.create({
        session_id: session._id,
        lecture_id: lectureId,
        question_index: idx,
        question: q.question.trim(),
        options: opts,
        correct_index: Number.isInteger(q.correctIndex) ? q.correctIndex : null,
        tags: Array.isArray(q.tags) ? q.tags : [],
        status: 'open',
        created_at: Date.now(),
        closed_at: null,
      });
      polls.push(poll);
    }

    if (session.time_limit) {
      setTimeout(async () => {
        const cur = await Session.findById(session._id).select('status');
        if (cur && cur.status === 'active') await closeSessionInternal(session._id);
      }, session.time_limit * 1000);
    }

    const io = getIO();
    if (io) io.to(`session:${session._id}`).emit('session:started', { session: { ...session.toObject(), polls } });

    const obj = session.toObject();
    obj.id = obj._id.toString();
    obj.polls = polls.map(p => { const o = p.toObject(); o.id = o._id.toString(); return o; });
    res.json(obj);
  } catch (err) {
    console.error('[session] create error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function joinSession(req, res) {
  try {
    const { code, name } = req.body || {};
    if (!code) return res.status(400).json({ error: 'Session code required' });

    const cleanCode = String(code).toUpperCase().trim();
    const session = await Session.findOne({ code: cleanCode });
    if (!session) return res.status(404).json({ error: 'Invalid session code. Please check and try again.' });

    if (session.status === 'closed') {
      return res.status(410).json({ error: 'This session has ended. Contact your professor for a new code.' });
    }

    if (session.time_limit) {
      const expiresAt = session.created_at + (session.time_limit * 1000);
      if (Date.now() > expiresAt) {
        await closeSessionInternal(session._id);
        return res.status(410).json({ error: 'This session has expired. Contact your professor for a new code.' });
      }
    }

    const studentId = req.user?.id || null;
    const guestName = (!studentId && name) ? name.trim() : (req.user?.name || 'Anonymous');

    let participant;
    let isRejoin = false;
    if (studentId) {
      participant = await SessionParticipant.findOne({ session_id: session._id, student_id: studentId });
      if (participant) isRejoin = true;
    }

    if (!participant) {
      try {
        participant = await SessionParticipant.create({
          session_id: session._id,
          student_id: studentId || undefined,
          guest_name: guestName,
          status: 'active',
          tab_switches: 0,
          joined_at: Date.now(),
        });
      } catch (e) {
        if (e.code === 11000 && studentId) {
          participant = await SessionParticipant.findOne({ session_id: session._id, student_id: studentId });
          isRejoin = true;
        }
        if (!participant) throw e;
      }
    }

    const polls = await Poll.find({ session_id: session._id }).sort({ question_index: 1 }).lean();
    const lecture = await Lecture.findById(session.lecture_id).select('name').lean();

    // BUG 2 FIX: For re-joins, return answered=[] so student sees all polls fresh.
    // submitSessionAnswer returns 409 if already answered — LiveSession treats 409 as submitted.
    // This allows multiple students to use the same session code without "poll expired" issues.
    const answered = isRejoin
      ? []
      : (await Response.find({ participant_id: participant._id }).select('poll_id').lean()).map(r => r.poll_id.toString());

    console.log(`[session/join] code=${cleanCode} | studentId=${studentId} | isRejoin=${isRejoin} | polls=${polls.length} | answered=${answered.length}`);

    const io = getIO();
    if (io) {
      io.to(`session:${session._id}`).emit('session:participant_joined', {
        participantId: participant._id.toString(),
        name: guestName || req.user?.name || 'Anonymous',
      });
    }

    res.json({
      session: { id: session._id.toString(), code: session.code, title: session.title, time_limit: session.time_limit, created_at: session.created_at },
      participant: { ...participant.toObject(), id: participant._id.toString() },
      polls: polls.map(p => ({ ...p, id: p._id.toString() })),
      answered,
      lecture_name: lecture?.name || '',
    });
  } catch (err) {
    console.error('[session] join error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function reportTabSwitch(req, res) {
  try {
    const { participantId } = req.body || {};
    if (!participantId) return res.status(400).json({ error: 'participantId required' });

    const p = await SessionParticipant.findById(participantId);
    if (!p) return res.status(404).json({ error: 'Participant not found' });
    if (p.status === 'disqualified') return res.json({ status: 'disqualified', tab_switches: p.tab_switches });

    const newCount = p.tab_switches + 1;
    let newStatus = p.status;
    if (newCount >= 2) newStatus = 'disqualified';
    else if (newCount === 1) newStatus = 'warned';

    await SessionParticipant.updateOne({ _id: participantId }, { tab_switches: newCount, status: newStatus });

    const io = getIO();
    if (io) {
      io.to(`session:${p.session_id}`).emit('session:cheat_update', {
        participantId: participantId.toString(),
        tab_switches: newCount,
        status: newStatus,
        name: p.guest_name || 'Student',
      });
    }

    res.json({ status: newStatus, tab_switches: newCount });
  } catch (err) {
    console.error('[session] tabswitch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function submitSessionAnswer(req, res) {
  try {
    const { pollId, participantId, answerIndex } = req.body || {};
    if (!pollId || !participantId || !Number.isInteger(answerIndex)) {
      return res.status(400).json({ error: 'pollId, participantId, and answerIndex required' });
    }

    const participant = await SessionParticipant.findById(participantId);
    if (!participant) return res.status(404).json({ error: 'Participant not found' });
    if (participant.status === 'disqualified') return res.status(403).json({ error: 'You have been disqualified' });

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.status !== 'open') return res.status(400).json({ error: 'Poll has been closed' });

    const existing = await Response.findOne({ poll_id: pollId, participant_id: participantId });
    if (existing) return res.status(409).json({ error: 'Already answered' });

    if (answerIndex < 0 || answerIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid answer' });
    }

    // ── Calculate correctness and points ──────────────────────────────────
    const isCorrect = poll.correct_index != null
      ? answerIndex === poll.correct_index
      : null;
    // 10 pts for correct, 1 pt for participation when no correct answer defined, 0 for wrong
    const pointsEarned = isCorrect === true ? 10 : isCorrect === null ? 1 : 0;
    console.log(`[session/answer] Poll ${pollId} | answerIndex=${answerIndex} | correct_index=${poll.correct_index} | isCorrect=${isCorrect} | pointsEarned=${pointsEarned}`);
    // ─────────────────────────────────────────────────────────────────────

    await Response.create({
      poll_id: pollId,
      participant_id: participantId,
      student_id: participant.student_id || null,
      answer_index: answerIndex,
      created_at: Date.now(),
    });

    // ── BUG 1 FIX: Update marks on the User record for logged-in students ─
    if (participant.student_id) {
      const updatedUser = await User.findByIdAndUpdate(
        participant.student_id,
        { $inc: { marks: pointsEarned } },
        { new: true }
      );
      console.log(`[session/answer] ✅ Marks saved | studentId=${participant.student_id} | +${pointsEarned} pts | total marks=${updatedUser?.marks ?? 'N/A'}`);
    }
    // ─────────────────────────────────────────────────────────────────────

    const counts = new Array(poll.options.length).fill(0);
    const allResp = await Response.find({ poll_id: pollId }).select('answer_index').lean();
    allResp.forEach(r => { if (r.answer_index >= 0 && r.answer_index < counts.length) counts[r.answer_index]++; });

    const io = getIO();
    if (io) {
      io.to(`session:${poll.session_id}`).emit('poll:update', {
        pollId: pollId.toString(),
        responseCounts: counts,
        totalResponses: allResp.length,
      });
    }

    res.json({
      ok: true,
      correct: isCorrect,
      pointsEarned,
    });
  } catch (err) {
    console.error('[session] answer error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function getSessionLive(req, res) {
  try {
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const participants = await SessionParticipant.find({ session_id: sessionId }).sort({ joined_at: 1 }).lean();

    const rawPolls = await Poll.find({ session_id: sessionId }).sort({ question_index: 1 }).lean();
    const polls = [];
    for (const p of rawPolls) {
      const allResp = await Response.find({ poll_id: p._id }).select('answer_index').lean();
      const counts = new Array(p.options.length).fill(0);
      allResp.forEach(r => { if (r.answer_index >= 0 && r.answer_index < counts.length) counts[r.answer_index]++; });
      polls.push({ ...p, id: p._id.toString(), response_counts: counts, total_responses: allResp.length });
    }

    const lecture = await Lecture.findById(session.lecture_id).select('name').lean();

    // ── Leaderboard: score each participant by correct answers ──
    const pollsWithCorrect = rawPolls.filter(p => p.correct_index != null);
    const leaderboard = [];
    for (const participant of participants) {
      if (participant.status === 'disqualified') continue;
      let correct = 0;
      for (const p of pollsWithCorrect) {
        const resp = await Response.findOne({ poll_id: p._id, participant_id: participant._id }).select('answer_index').lean();
        if (resp && resp.answer_index === p.correct_index) correct++;
      }
      leaderboard.push({
        id: participant._id.toString(),
        name: participant.guest_name || 'Anonymous',
        status: participant.status,
        score: correct,
        total: pollsWithCorrect.length,
        tab_switches: participant.tab_switches,
      });
    }
    leaderboard.sort((a, b) => b.score - a.score);

    res.json({
      session: { ...session, id: session._id.toString() },
      lecture_name: lecture?.name || '',
      participants: participants.map(p => ({ ...p, id: p._id.toString() })),
      polls,
      leaderboard,
      stats: {
        total_participants: participants.length,
        active: participants.filter(p => p.status === 'active').length,
        warned: participants.filter(p => p.status === 'warned').length,
        disqualified: participants.filter(p => p.status === 'disqualified').length,
      },
    });
  } catch (err) {
    console.error('[session] live error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function closeSession(req, res) {
  try {
    const { sessionId } = req.params;
    await closeSessionInternal(sessionId);
    res.json({ ok: true });
  } catch (err) {
    console.error('[session] close error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function closeSessionInternal(sessionId) {
  const now = Date.now();
  await Session.updateOne({ _id: sessionId }, { status: 'closed', closed_at: now });
  await Poll.updateMany({ session_id: sessionId, status: 'open' }, { status: 'closed', closed_at: now });
  const io = getIO();
  if (io) io.to(`session:${sessionId}`).emit('session:closed', { sessionId: sessionId.toString() });
}

async function listSessions(req, res) {
  try {
    const sessions = await Session.find({ faculty_id: req.user.id }).sort({ created_at: -1 }).lean();
    const result = [];
    for (const s of sessions) {
      const participantCount = await SessionParticipant.countDocuments({ session_id: s._id });
      const questionCount = await Poll.countDocuments({ session_id: s._id });
      const lecture = await Lecture.findById(s.lecture_id).select('name').lean();
      result.push({
        ...s, id: s._id.toString(),
        lecture_name: lecture?.name || '',
        participant_count: participantCount,
        question_count: questionCount,
      });
    }
    res.json(result);
  } catch (err) {
    console.error('[session] list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function checkSession(req, res) {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const cleanCode = String(code).toUpperCase().trim();
    const session = await Session.findOne({ code: cleanCode }).select('code title status time_limit created_at').lean();

    if (!session) return res.status(404).json({ valid: false, reason: 'invalid', error: 'Invalid session code' });
    if (session.status === 'closed') return res.json({ valid: false, reason: 'closed', error: 'Session has ended' });

    if (session.time_limit) {
      const expiresAt = session.created_at + (session.time_limit * 1000);
      if (Date.now() > expiresAt) {
        await closeSessionInternal(session._id);
        return res.json({ valid: false, reason: 'expired', error: 'Session has expired' });
      }
    }

    res.json({ valid: true, title: session.title, code: session.code });
  } catch (err) {
    console.error('[session] check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function validateParticipant(req, res) {
  try {
    const { sessionId, participantId } = req.params;
    const session = await Session.findById(sessionId).select('status code title time_limit created_at lecture_id').lean();
    if (!session) return res.status(404).json({ valid: false, error: 'Session not found' });

    if (session.time_limit) {
      const expiresAt = session.created_at + (session.time_limit * 1000);
      if (Date.now() > expiresAt && session.status === 'active') {
        await closeSessionInternal(session._id);
        return res.json({ valid: false, reason: 'expired' });
      }
    }
    if (session.status === 'closed') return res.json({ valid: false, reason: 'closed' });

    const participant = await SessionParticipant.findOne({ _id: participantId, session_id: sessionId }).lean();
    if (!participant) return res.json({ valid: false, reason: 'not_found' });

    const polls = await Poll.find({ session_id: sessionId }).sort({ question_index: 1 }).lean();
    // Return empty answered on validate — let submitSessionAnswer's 409 mark polls as submitted
    // This prevents the "all done" flash when student refreshes or re-enters session
    const answered = [];
    const lecture = await Lecture.findById(session.lecture_id).select('name').lean();

    res.json({
      valid: true,
      session: { id: session._id.toString(), code: session.code, title: session.title, time_limit: session.time_limit, created_at: session.created_at },
      participant: { ...participant, id: participant._id.toString() },
      polls: polls.map(p => ({ ...p, id: p._id.toString() })),
      answered,
      lecture_name: lecture?.name || '',
    });
  } catch (err) {
    console.error('[session] validate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  createSession, joinSession, reportTabSwitch, submitSessionAnswer,
  getSessionLive, closeSession, listSessions, checkSession, validateParticipant,
};
