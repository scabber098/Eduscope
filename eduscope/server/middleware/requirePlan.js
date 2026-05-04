// middleware/requirePlan.js
const Subscription = require('../models/Subscription');

function requirePlan(feature) {
  return async (req, res, next) => {
    try {
      const universityId = req.user?.university_id;
      if (!universityId) return res.status(403).json({ error: 'No university associated with account' });

      const sub = await Subscription.findOne({ university_id: universityId }).populate('plan_id');
      if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
        return res.status(403).json({ error: 'Active subscription required', feature });
      }

      const plan = sub.plan_id;
      if (!plan || !plan.features.includes(feature)) {
        return res.status(403).json({ error: `Feature "${feature}" not included in your plan`, plan: plan?.name });
      }

      req.subscription = sub;
      req.plan = plan;
      next();
    } catch (err) {
      console.error('[requirePlan]', err.message);
      res.status(500).json({ error: 'Plan check failed' });
    }
  };
}

module.exports = { requirePlan };
