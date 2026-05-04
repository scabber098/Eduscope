const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  name:       { type: String, required: true, unique: true },
  short_name: { type: String, required: true },
  city:       { type: String, default: null },
  active:     { type: Boolean, default: true },
  created_at: { type: Number, default: Date.now },
});

module.exports = mongoose.model('University', universitySchema);
