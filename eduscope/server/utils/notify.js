// utils/notify.js — call from any controller
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

async function createNotification(userId, type, title, body = '', metadata = {}) {
  try {
    const notif = await Notification.create({ user_id: userId, type, title, body, metadata });
    const io = getIO();
    if (io) io.to(`user:${userId}`).emit('notification:new', { notification: notif });
    return notif;
  } catch (err) {
    console.error('[notify] Failed to create notification:', err.message);
    return null;
  }
}

module.exports = { createNotification };
