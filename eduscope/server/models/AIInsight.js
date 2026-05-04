const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  session_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
  summary:      { type: String, default: '' },
  suggestions:  { type: [String], default: [] },
  gaps:         { type: [String], default: [] },
  generated_at: { type: Number, default: Date.now },
});

module.exports = mongoose.model('AIInsight', aiInsightSchema);
