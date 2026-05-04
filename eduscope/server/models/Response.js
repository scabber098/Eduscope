const mongoose = require('mongoose');

const responseSchema = new mongoose.Schema({
  poll_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  participant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'SessionParticipant', default: null },
  student_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  answer_index:   { type: Number, required: true },
  created_at:     { type: Number, default: Date.now },
});

responseSchema.index({ poll_id: 1, participant_id: 1 }, { unique: true, sparse: true });
responseSchema.index({ poll_id: 1, student_id: 1 });
responseSchema.index({ student_id: 1 });

module.exports = mongoose.model('Response', responseSchema);
