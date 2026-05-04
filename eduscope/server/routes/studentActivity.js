// NEW route file — does not modify any existing routes
const express = require('express');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { authRequired, requireRole } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

const router = express.Router();

// POST /api/student/activity — log tab switch (called by student frontend)
router.post('/activity', authRequired, requireRole('student'), async (req, res) => {
  try {
    const { type, count, timestamp } = req.body || {};
    if (!type) return res.status(400).json({ error: 'type required' });

    const studentId = req.user.id;

    // Log the activity
    await Activity.create({
      studentId,
      type,
      count: count || 1,
      timestamp: timestamp || Date.now(),
    });

    // For TAB_SWITCH: increment counter on User, set isDisqualified if >= 3
    if (type === 'TAB_SWITCH') {
      const user = await User.findById(studentId);
      if (!user) return res.status(404).json({ error: 'Student not found' });

      const newCount = (user.tabSwitchCount || 0) + 1;
      const isDisqualified = newCount >= 3;

      await User.findByIdAndUpdate(studentId, {
        $set: { tabSwitchCount: newCount, isDisqualified },
      });

      await logAudit({ userId: studentId, action: 'TAB_SWITCH', metadata: { count: newCount } });
      if (isDisqualified) {
        await logAudit({ userId: studentId, action: 'DISQUALIFIED', metadata: { tabSwitchCount: newCount } });
      }

      console.log(`[activity] TAB_SWITCH studentId=${studentId} count=${newCount} disqualified=${isDisqualified}`);
      return res.json({ ok: true, tabSwitchCount: newCount, isDisqualified });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[activity] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/student/block/:registrationNumber — faculty blocks a student
router.put('/block/:registrationNumber', authRequired, requireRole('faculty'), async (req, res) => {
  try {
    const { registrationNumber } = req.params;
    if (!registrationNumber) return res.status(400).json({ error: 'registrationNumber required' });

    const student = await User.findOneAndUpdate(
      { registrationNumber: registrationNumber.trim(), role: 'student' },
      { $set: { isBlocked: true } },
      { new: true }
    ).select('name email registrationNumber isBlocked');

    if (!student) return res.status(404).json({ error: 'Student not found with that registration number' });

    console.log(`[student/block] Blocked: ${student.name} (${student.registrationNumber})`);
    await logAudit({ userId: student._id, action: 'BLOCKED', metadata: { blockedBy: req.user.id, registrationNumber: student.registrationNumber } });
    res.json({ ok: true, student: { id: student._id.toString(), name: student.name, registrationNumber: student.registrationNumber, isBlocked: student.isBlocked } });
  } catch (err) {
    console.error('[student/block] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/student/unblock/:registrationNumber — faculty unblocks a student
router.put('/unblock/:registrationNumber', authRequired, requireRole('faculty'), async (req, res) => {
  try {
    const { registrationNumber } = req.params;

    const student = await User.findOneAndUpdate(
      { registrationNumber: registrationNumber.trim(), role: 'student' },
      { $set: { isBlocked: false } },
      { new: true }
    ).select('name email registrationNumber isBlocked');

    if (!student) return res.status(404).json({ error: 'Student not found' });

    console.log(`[student/unblock] Unblocked: ${student.name}`);
    await logAudit({ userId: student._id, action: 'UNBLOCKED', metadata: { unblockedBy: req.user.id } });
    res.json({ ok: true, student: { id: student._id.toString(), name: student.name, registrationNumber: student.registrationNumber, isBlocked: student.isBlocked } });
  } catch (err) {
    console.error('[student/unblock] error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
