// utils/seedPlans.js
const Plan = require('../models/Plan');

async function seedPlans() {
  try {
    const count = await Plan.countDocuments();
    if (count > 0) return;

    await Plan.insertMany([
      {
        name: 'Free',
        price_monthly: 0,
        price_yearly: 0,
        max_faculty: 1,
        max_students_per_session: 30,
        max_sessions_per_month: 10,
        features: ['live_polls', 'basic_analytics', 'leaderboard'],
        is_active: true,
      },
      {
        name: 'Pro',
        price_monthly: 2999,   // in paise / cents
        price_yearly: 29999,
        max_faculty: 10,
        max_students_per_session: 200,
        max_sessions_per_month: 100,
        features: ['live_polls', 'basic_analytics', 'leaderboard', 'advanced_analytics', 'question_bank', 'scheduled_sessions', 'notifications'],
        is_active: true,
      },
      {
        name: 'Enterprise',
        price_monthly: 9999,
        price_yearly: 99999,
        max_faculty: -1,
        max_students_per_session: -1,
        max_sessions_per_month: -1,
        features: ['live_polls', 'basic_analytics', 'leaderboard', 'advanced_analytics', 'question_bank', 'scheduled_sessions', 'notifications', 'ai_insights', 'admin_dashboard', 'audit_logs'],
        is_active: true,
      },
    ]);

    console.log('[db] ✅ Plans seeded: Free, Pro, Enterprise');
  } catch (err) {
    console.error('[db] ❌ Plan seed error:', err.message);
  }
}

module.exports = { seedPlans };
