// NEW FILE: server/middleware/rateLimiter.js
// express-rate-limit wrappers for login and poll-join routes
// Does NOT modify any existing middleware

let rateLimit;
try {
  rateLimit = require('express-rate-limit');
} catch (e) {
  // If package not installed yet, use passthrough middleware and log warning
  console.warn('[rateLimiter] express-rate-limit not installed. Run: npm install express-rate-limit');
  const passThrough = (_req, _res, next) => next();
  module.exports = { loginLimiter: passThrough, pollJoinLimiter: passThrough };
  return;
}

// 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req) => req.ip,
});

// 20 poll join attempts per 5 minutes per IP
const pollJoinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many poll join attempts. Please slow down.' },
  keyGenerator: (req) => req.ip,
});

module.exports = { loginLimiter, pollJoinLimiter };
