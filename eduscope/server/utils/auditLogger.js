// NEW utility: server/utils/auditLogger.js
// Centralised helper — import anywhere to log actions without coupling models
const AuditLog = require('../models/AuditLog');

/**
 * logAudit({ userId, action, metadata })
 * Fire-and-forget; never throws.
 */
async function logAudit({ userId, action, metadata = {} }) {
  try {
    await AuditLog.create({ userId: userId || null, action, metadata, timestamp: Date.now() });
  } catch (err) {
    // Audit failure must never crash the request
    console.error('[audit] log error:', err.message);
  }
}

module.exports = { logAudit };
