const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name:                    { type: String, required: true, unique: true },
  price_monthly:           { type: Number, required: true },
  price_yearly:            { type: Number, required: true },
  max_faculty:             { type: Number, default: -1 }, // -1 = unlimited
  max_students_per_session:{ type: Number, default: -1 },
  max_sessions_per_month:  { type: Number, default: -1 },
  features:                { type: [String], default: [] },
  is_active:               { type: Boolean, default: true },
  created_at:              { type: Number, default: Date.now },
});

module.exports = mongoose.model('Plan', planSchema);
