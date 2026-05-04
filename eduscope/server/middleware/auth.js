// === FILE: server/middleware/auth.js ===
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch(e) { req.user = null; }
  } else {
    req.user = null;
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) return res.status(403).json({ error: `Requires ${role} role` });
    next();
  };
}

function signToken(user) {
  return jwt.sign({
    id: (user._id || user.id).toString(),
    email: user.email,
    role: user.role,
    name: user.name,
    university_id: user.university_id ? user.university_id.toString() : null,
    department_id: user.department_id ? user.department_id.toString() : null,
  }, JWT_SECRET, { expiresIn: '7d' });
}

// allowRoles: accepts multiple roles. e.g. allowRoles('faculty','admin')
function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Requires one of roles: ${roles.join(', ')}` });
    }
    next();
  };
}

module.exports = { authRequired, optionalAuth, requireRole, allowRoles, signToken };
