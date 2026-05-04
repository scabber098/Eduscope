const mongoose = require('mongoose');

const embeddedQuestionSchema = new mongoose.Schema({
  question:      { type: String, required: true },
  options:       { type: [String], required: true },
  correct_index: { type: Number, default: null },
  tags:          { type: [String], default: [] },
}, { _id: false });

const attemptSchema = new mongoose.Schema({
  student_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers:       { type: [Number], default: [] }, // answer_index per question
  score:         { type: Number, default: 0 },
  total:         { type: Number, default: 0 },
  submitted_at:  { type: Number, default: Date.now },
}, { _id: false });

const scheduledSessionSchema = new mongoose.Schema({
  faculty_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  university_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  lecture_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', default: null },
  title:           { type: String, required: true, trim: true },
  scheduled_at:    { type: Number, required: true }, // ms epoch
  duration_minutes:{ type: Number, required: true },
  questions:       { type: [embeddedQuestionSchema], default: [] },
  access_code:     { type: String, default: '' },
  status:          { type: String, enum: ['pending', 'open', 'expired'], default: 'pending' },
  max_attempts:    { type: Number, default: 1 },
  attempts:        { type: [attemptSchema], default: [] },
  created_at:      { type: Number, default: Date.now },
});

scheduledSessionSchema.index({ faculty_id: 1 });
scheduledSessionSchema.index({ status: 1 });
scheduledSessionSchema.index({ scheduled_at: 1 });
scheduledSessionSchema.index({ university_id: 1 });

module.exports = mongoose.model('ScheduledSession', scheduledSessionSchema);
