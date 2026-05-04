// NEW MODEL: server/models/PollSession.js
// Tracks when a student "started" a timed poll
// Does NOT modify any existing model
const mongoose = require('mongoose');

const pollSessionSchema = new mongoose.Schema({
  pollId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Number, default: Date.now },
  submitted: { type: Boolean, default: false },
  autoSubmitted: { type: Boolean, default: false },
});

pollSessionSchema.index({ pollId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('PollSession', pollSessionSchema);
