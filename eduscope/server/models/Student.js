const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  class:           { type: String, required: true, trim: true },
  section:         { type: String, required: true, trim: true },
  university_name: { type: String, default: '', trim: true },
  marks:           { type: Number, required: true, default: 0 },
  created_at:      { type: Date, default: Date.now },
});

module.exports = mongoose.model('Student', studentSchema);
