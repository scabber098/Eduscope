const mongoose = require('mongoose');

const questionBankSchema = new mongoose.Schema({
  faculty_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  university_id: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  question:      { type: String, required: true, trim: true },
  options:       { type: [String], required: true },
  correct_index: { type: Number, default: null },
  tags:          { type: [String], default: [] },
  difficulty:    { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  subject:       { type: String, default: '', trim: true },
  usage_count:   { type: Number, default: 0 },
  archived:      { type: Boolean, default: false },
  created_at:    { type: Number, default: Date.now },
});

questionBankSchema.index({ faculty_id: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ subject: 1 });
questionBankSchema.index({ faculty_id: 1, archived: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
