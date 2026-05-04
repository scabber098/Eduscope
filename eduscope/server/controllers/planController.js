const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const University = require('../models/University');
const Session = require('../models/Session');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { createNotification } = require('../utils/notify');

// GET /api/plans
async function listPlans(req, res) {
  try {
    const plans = await Plan.find({ is_active: true }).sort({ price_monthly: 1 });
    res.json({ data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/subscriptions — admin only
async function createSubscription(req, res) {
  try {
    const { university_id, plan_id, billing_cycle, ends_at } = req.body || {};
    if (!university_id || !plan_id) return res.status(400).json({ error: 'university_id and plan_id required' });

    const uni = await University.findById(university_id);
    if (!uni) return res.status(404).json({ error: 'University not found' });

    const plan = await Plan.findById(plan_id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const sub = await Subscription.findOneAndUpdate(
      { university_id },
      { plan_id, billing_cycle: billing_cycle || 'monthly', status: 'active', starts_at: Date.now(), ends_at: ends_at || null },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      userId: req.user.id,
      action: 'SUBSCRIPTION_ASSIGNED',
      metadata: { university_id, plan_name: plan.name },
      timestamp: Date.now(),
    });

    // notify all faculty of that university
    const facultyList = await User.find({ university_id, role: 'faculty' }).select('_id');
    for (const f of facultyList) {
      await createNotification(f._id, 'SUBSCRIPTION', `Plan Updated: ${plan.name}`, `Your university subscription has been set to ${plan.name}.`, { plan_id });
    }

    res.json({ data: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/subscriptions/my
async function mySubscription(req, res) {
  try {
    const universityId = req.user?.university_id;
    if (!universityId) return res.status(400).json({ error: 'No university on account' });

    const sub = await Subscription.findOne({ university_id: universityId }).populate('plan_id');

    // usage stats
    const now = Date.now();
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
    const [facultyCount, sessionCount] = await Promise.all([
      User.countDocuments({ university_id: universityId, role: 'faculty' }),
      Session.countDocuments({ university_id: universityId, created_at: { $gte: monthStart.getTime() } }),
    ]);

    res.json({
      data: {
        subscription: sub,
        usage: { faculty_count: facultyCount, sessions_this_month: sessionCount },
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listPlans, createSubscription, mySubscription };
