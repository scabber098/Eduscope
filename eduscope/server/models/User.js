const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:           { type: String, required: true },
  role:               { type: String, required: true, enum: ['student', 'faculty'] },
  marks:              { type: Number, default: 0 },
  class:              { type: String, default: '' },
  section:            { type: String, default: '' },
  university_name:    { type: String, default: '' },
  university_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
  department_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  created_at:         { type: Number, default: Date.now },
  // Feature 4: registration number
  registrationNumber: { type: String, default: '', trim: true },
  // Feature 2: tab switch tracking
  tabSwitchCount:     { type: Number, default: 0 },
  isDisqualified:     { type: Boolean, default: false },
  // Feature 5: faculty block
  isBlocked:          { type: Boolean, default: false },
});

userSchema.index({ university_id: 1 });
userSchema.index({ role: 1 });
userSchema.index({ registrationNumber: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
