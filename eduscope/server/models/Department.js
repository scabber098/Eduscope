const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  university_id: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  name:          { type: String, required: true },
  created_at:    { type: Number, default: Date.now },
});

departmentSchema.index({ university_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
