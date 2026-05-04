const University = require('../models/University');
const User = require('../models/User');
const Session = require('../models/Session');
const Poll = require('../models/Poll');
const Response = require('../models/Response');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const AuditLog = require('../models/AuditLog');
const { createNotification } = require('../utils/notify');

// GET /api/admin/universities
async function listUniversities(req, res) {
  try {
    const unis = await University.find().lean();
    const results = await Promise.all(unis.map(async (u) => {
      const [studentCount, facultyCount, sessionCount, lastSession, sub] = await Promise.all([
        User.countDocuments({ university_id: u._id, role: 'student' }),
        User.countDocuments({ university_id: u._id, role: 'faculty' }),
        Session.countDocuments({ university_id: u._id }),
        Session.findOne({ university_id: u._id }).sort({ created_at: -1 }).select('created_at').lean(),
        Subscription.findOne({ university_id: u._id }).populate('plan_id', 'name').lean(),
      ]);
      return { ...u, student_count: studentCount, faculty_count: facultyCount, session_count: sessionCount, last_activity: lastSession?.created_at || null, plan: sub?.plan_id?.name || 'None', subscription_status: sub?.status || 'none' };
    }));
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/stats
async function platformStats(req, res) {
  try {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const [uniTotal, facultyTotal, studentTotal, sessionTotal, pollTotal, responseTotal,
           sessionRecent, responseRecent, studentRecent] = await Promise.all([
      University.countDocuments(),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'student' }),
      Session.countDocuments(),
      Poll.countDocuments(),
      Response.countDocuments(),
      Session.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      Response.countDocuments({ created_at: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ role: 'student', created_at: { $gte: thirtyDaysAgo } }),
    ]);
    res.json({
      data: {
        all_time: { universities: uniTotal, faculty: facultyTotal, students: studentTotal, sessions: sessionTotal, polls: pollTotal, responses: responseTotal },
        last_30_days: { sessions: sessionRecent, responses: responseRecent, new_students: studentRecent },
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/universities/:id/plan
async function assignPlan(req, res) {
  try {
    const { id } = req.params;
    const { plan_id, billing_cycle } = req.body || {};
    if (!plan_id) return res.status(400).json({ error: 'plan_id required' });

    const plan = await Plan.findById(plan_id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const sub = await Subscription.findOneAndUpdate(
      { university_id: id },
      { plan_id, status: 'active', billing_cycle: billing_cycle || 'monthly', starts_at: Date.now() },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      userId: req.user.id,
      action: 'PLAN_ASSIGNED',
      metadata: { university_id: id, plan: plan.name },
      timestamp: Date.now(),
    });

    res.json({ data: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/admin/universities/:id/suspend
async function suspendUniversity(req, res) {
  try {
    const { id } = req.params;
    const uni = await University.findById(id);
    if (!uni) return res.status(404).json({ error: 'University not found' });

    uni.active = !uni.active;
    await uni.save();

    await AuditLog.create({
      userId: req.user.id,
      action: uni.active ? 'UNI_UNSUSPENDED' : 'UNI_SUSPENDED',
      metadata: { university_id: id },
      timestamp: Date.now(),
    });

    res.json({ data: { id, active: uni.active } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/admin/audit-logs
async function getAuditLogs(req, res) {
  try {
    const { action, userId, universityId, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (from || to) {
      filter.timestamp = {};
      if (from) filter.timestamp.$gte = Number(from);
      if (to)   filter.timestamp.$lte = Number(to);
    }
    if (universityId) filter['metadata.university_id'] = universityId;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(Number(limit)).populate('userId', 'name email role').lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({ data: logs, meta: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listUniversities, platformStats, assignPlan, suspendUniversity, getAuditLogs };
