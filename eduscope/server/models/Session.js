const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true },
  lecture_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  faculty_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, default: 'Live Session' },
  status:        { type: String, enum: ['active', 'closed'], default: 'active' },
  time_limit:    { type: Number, default: null },
  university_id: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  created_at:    { type: Number, default: Date.now },
  closed_at:     { type: Number, default: null },
});

sessionSchema.index({ faculty_id: 1 });
sessionSchema.index({ university_id: 1 });

module.exports = mongoose.model('Session', sessionSchema);
