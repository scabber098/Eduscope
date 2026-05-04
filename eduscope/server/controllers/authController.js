// === FILE: server/controllers/authController.js (MongoDB) ===
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const University = require('../models/University');
const Department = require('../models/Department');
const { signToken } = require('../middleware/auth');
const { logAudit } = require('../utils/auditLogger');

async function register(req, res) {
  try {
    const { name, email, password, role, universityId, departmentId, class: cls, section, universityName, registrationNumber } = req.body || {};
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role required' });
    }
    // Name validation: only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(name.trim())) {
      return res.status(400).json({ error: 'Name can only contain letters and spaces.' });
    }
    if (!['student', 'faculty'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (role === 'faculty' && (!universityId || !departmentId)) {
      return res.status(400).json({ error: 'Faculty must specify university and department' });
    }

    if (universityId) {
      const uni = await University.findOne({ _id: universityId, active: true });
      if (!uni) return res.status(400).json({ error: 'Invalid university' });
    }
    if (departmentId) {
      const dept = await Department.findOne({ _id: departmentId, university_id: universityId });
      if (!dept) return res.status(400).json({ error: 'Department does not belong to that university' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Feature 4: check registrationNumber uniqueness if provided
    if (registrationNumber && registrationNumber.trim()) {
      const regExisting = await User.findOne({ registrationNumber: registrationNumber.trim(), role: 'student' });
      if (regExisting) return res.status(409).json({ error: 'Registration number already in use' });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: bcrypt.hashSync(password, 10),
      role,
      marks: 0,
      class:              (role === 'student' && cls)                ? cls.trim() : '',
      section:            (role === 'student' && section)            ? section.trim() : '',
      university_name:    (role === 'student' && universityName)     ? universityName.trim() : '',
      registrationNumber: (role === 'student' && registrationNumber) ? registrationNumber.trim() : '',
      university_id: universityId || null,
      department_id: departmentId || null,
      created_at: Date.now(),
    });
    console.log('[auth] ✅ User registered:', { id: user._id.toString(), email: user.email, role: user.role });
    await logAudit({ userId: user._id, action: 'REGISTER', metadata: { email: user.email, role: user.role } });

    const token = signToken(user);
    const uni = user.university_id ? await University.findById(user.university_id).select('name short_name') : null;
    const dept = user.department_id ? await Department.findById(user.department_id).select('name') : null;

    res.json({
      token,
      user: {
        id: user._id.toString(), name: user.name, email: user.email, role: user.role,
        registrationNumber: user.registrationNumber,
        university: uni, department: dept,
      },
    });
  } catch (err) {
    console.error('[auth] register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });

    // Feature 5: block check
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact your faculty.' });
    }

    const token = signToken(user);
    console.log('[auth] ✅ User logged in:', { id: user._id.toString(), email: user.email, role: user.role });
    await logAudit({ userId: user._id, action: 'LOGIN', metadata: { email: user.email, role: user.role } });
    const uni = user.university_id ? await University.findById(user.university_id).select('name short_name') : null;
    const dept = user.department_id ? await Department.findById(user.department_id).select('name') : null;

    res.json({
      token,
      user: {
        id: user._id.toString(), name: user.name, email: user.email, role: user.role,
        registrationNumber: user.registrationNumber || '',
        university: uni, department: dept,
      },
    });
  } catch (err) {
    console.error('[auth] login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { register, login };
