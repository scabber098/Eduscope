const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:       { type: String, required: true },
  title:      { type: String, required: true },
  body:       { type: String, default: '' },
  metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
  read:       { type: Boolean, default: false },
  created_at: { type: Number, default: Date.now },
});

notificationSchema.index({ user_id: 1, read: 1, created_at: -1 });
notificationSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
