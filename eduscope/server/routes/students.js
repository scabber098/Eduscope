// === FILE: server/routes/students.js ===
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

// GET /api/students — returns role=student users with real marks, ranked
// EXTENDED: pagination (?page=1&limit=20) + filtering (?university=X&isDisqualified=true)
router.get('/', async (req, res) => {
  try {
    console.log('[students] GET /api/students called');

    // --- Pagination ---
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 0)); // 0 = no limit (legacy)

    // --- Filtering ---
    const filter = { role: 'student' };
    if (req.query.university) {
      filter.university_name = { $regex: req.query.university, $options: 'i' };
    }
    if (req.query.isDisqualified !== undefined) {
      filter.isDisqualified = req.query.isDisqualified === 'true';
    }

    const totalCount = await User.countDocuments(filter);

    let query = User.find(filter)
      .select('name email class section marks university_name registrationNumber tabSwitchCount isDisqualified isBlocked created_at')
      .sort({ marks: -1, name: 1 })
      .lean();

    if (limit > 0) {
      query = query.skip((page - 1) * limit).limit(limit);
    }

    const students = await query;
    console.log(`[students] found ${students.length} of ${totalCount} student users`);

    const startRank = limit > 0 ? (page - 1) * limit + 1 : 1;
    const ranked = students.map((s, i) => ({
      id:                 s._id.toString(),
      name:               s.name || 'Unknown',
      email:              s.email || '',
      class:              s.class || '',
      section:            s.section || '',
      university_name:    s.university_name || '',
      registrationNumber: s.registrationNumber || '',
      marks:              Number(s.marks || 0),
      tabSwitchCount:     Number(s.tabSwitchCount || 0),
      isDisqualified:     Boolean(s.isDisqualified),
      isBlocked:          Boolean(s.isBlocked),
      rank:               startRank + i,
      source:             'users',
    }));

    console.log('[students] returning:', ranked.map(s => `${s.name}(${s.marks})`));

    res.json({
      success: true,
      students: ranked,
      pagination: limit > 0 ? {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      } : null,
    });
  } catch (err) {
    console.error('[students] GET error:', err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// PATCH /api/students/:id — update class/section for a student user (unchanged)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { class: cls, section } = req.body;
    const update = {};
    if (cls !== undefined) update.class = cls.trim();
    if (section !== undefined) update.section = section.trim();

    const user = await User.findOneAndUpdate(
      { _id: id, role: 'student' },
      { $set: update },
      { new: true }
    ).select('name class section marks');

    if (!user) return res.status(404).json({ success: false, error: 'Student not found' });
    console.log(`[students] updated ${user.name}: class=${user.class}, section=${user.section}`);
    res.json({ success: true, student: { id: user._id.toString(), name: user.name, class: user.class, section: user.section, marks: user.marks } });
  } catch (err) {
    console.error('[students] PATCH error:', err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

// GET /api/students/export — CSV download
// NEW: does not touch any existing logic
router.get('/export', async (req, res) => {
  try {
    console.log('[students] GET /api/students/export called');

    const students = await User.find({ role: 'student' })
      .select('name registrationNumber marks isDisqualified isBlocked email class section university_name tabSwitchCount')
      .sort({ marks: -1, name: 1 })
      .lean();

    // Build CSV
    const header = ['name', 'registrationNumber', 'email', 'class', 'section', 'university_name', 'marks', 'tabSwitchCount', 'status'];
    const escape = (val) => {
      const s = String(val == null ? '' : val);
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const rows = students.map(s => {
      const status = s.isBlocked ? 'blocked' : s.isDisqualified ? 'disqualified' : 'active';
      return [
        s.name, s.registrationNumber, s.email, s.class,
        s.section, s.university_name, s.marks, s.tabSwitchCount, status,
      ].map(escape).join(',');
    });

    const csv = [header.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="students_export_${Date.now()}.csv"`);
    res.send(csv);

    console.log(`[students/export] exported ${students.length} students`);
  } catch (err) {
    console.error('[students/export] error:', err);
    res.status(500).json({ success: false, error: 'Server error: ' + err.message });
  }
});

module.exports = router;
