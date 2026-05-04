// NEW FILE: server/routes/analyticsSummary.js
// GET /api/analytics/summary — global stats for admin/faculty dashboards
// Does NOT touch existing analytics routes
const express = require('express');
const User = require('../models/User');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary
// Returns: { totalStudents, averageMarks, highestMarks, disqualifiedCount, totalTabSwitches }
router.get('/summary', authRequired, allowRoles('faculty', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('marks tabSwitchCount isDisqualified')
      .lean();

    const totalStudents = students.length;
    const totalMarks = students.reduce((sum, s) => sum + (s.marks || 0), 0);
    const averageMarks = totalStudents > 0 ? Math.round((totalMarks / totalStudents) * 100) / 100 : 0;
    const highestMarks = totalStudents > 0 ? Math.max(...students.map(s => s.marks || 0)) : 0;
    const disqualifiedCount = students.filter(s => s.isDisqualified).length;
    const totalTabSwitches = students.reduce((sum, s) => sum + (s.tabSwitchCount || 0), 0);

    res.json({
      totalStudents,
      averageMarks,
      highestMarks,
      disqualifiedCount,
      totalTabSwitches,
    });
  } catch (err) {
    console.error('[analytics/summary] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
