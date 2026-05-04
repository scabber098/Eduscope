const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  university_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true, unique: true },
  plan_id:        { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
  status:         { type: String, enum: ['trial', 'active', 'expired', 'cancelled'], default: 'trial' },
  billing_cycle:  { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  starts_at:      { type: Number, default: Date.now },
  ends_at:        { type: Number, default: null },
  created_at:     { type: Number, default: Date.now },
});

subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ ends_at: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
