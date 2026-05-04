// NEW model — does not affect any existing models
const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:      { type: String, required: true }, // e.g. "TAB_SWITCH"
  count:     { type: Number, default: 1 },
  timestamp: { type: Number, default: Date.now },
  created_at:{ type: Number, default: Date.now },
});

activitySchema.index({ studentId: 1 });
activitySchema.index({ type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
