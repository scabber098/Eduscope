const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  session_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  student_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guest_name:   { type: String, default: null },
  status:       { type: String, enum: ['active', 'warned', 'disqualified'], default: 'active' },
  tab_switches: { type: Number, default: 0 },
  joined_at:    { type: Number, default: Date.now },
});

participantSchema.index({ session_id: 1, student_id: 1 }, { unique: true, sparse: true });
participantSchema.index({ session_id: 1 });

module.exports = mongoose.model('SessionParticipant', participantSchema);
