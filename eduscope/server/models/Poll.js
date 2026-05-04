const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  session_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Session', default: null },
  lecture_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  question_index: { type: Number, default: 0 },
  question:       { type: String, required: true },
  options:        { type: [String], required: true },
  correct_index:  { type: Number, default: null },
  tags:           { type: [String], default: [] },
  status:         { type: String, enum: ['open', 'closed'], default: 'open' },
  created_at:     { type: Number, default: Date.now },
  closed_at:      { type: Number, default: null },
  // Feature: Poll Timer — optional duration in minutes; 0/null = no timer
  duration:       { type: Number, default: null },
});

pollSchema.index({ session_id: 1 });
pollSchema.index({ lecture_id: 1 });

module.exports = mongoose.model('Poll', pollSchema);
