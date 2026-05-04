const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  archived:   { type: Boolean, default: false },
  created_at: { type: Number, default: Date.now },
});

lectureSchema.index({ faculty_id: 1 });

module.exports = mongoose.model('Lecture', lectureSchema);
