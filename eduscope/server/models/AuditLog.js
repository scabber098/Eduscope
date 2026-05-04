// NEW model: AuditLog — does not modify any existing models
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:    {
    type: String,
    required: true,
    enum: ['LOGIN', 'REGISTER', 'TAB_SWITCH', 'DISQUALIFIED', 'BLOCKED', 'UNBLOCKED', 'POLL_SUBMITTED', 'POLL_CREATED', 'POLL_CLOSED', 'SUBSCRIPTION_ASSIGNED', 'PLAN_ASSIGNED', 'UNI_SUSPENDED', 'UNI_UNSUSPENDED'],
  },
  metadata:  { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Number, default: Date.now },
});

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
