const Notification = require('../models/Notification');

// GET /api/notifications
async function listNotifications(req, res) {
  try {
    const { unread, page = 1 } = req.query;
    const filter = { user_id: req.user.id };
    if (unread === 'true') filter.read = false;

    const skip = (Number(page) - 1) * 20;
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ created_at: -1 }).skip(skip).limit(20),
      Notification.countDocuments(filter),
    ]);
    res.json({ data: notifications, meta: { total, page: Number(page), pages: Math.ceil(total / 20) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/notifications/:id/read
async function markRead(req, res) {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Not found' });
    res.json({ data: n });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PATCH /api/notifications/read-all
async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ user_id: req.user.id, read: false }, { read: true });
    res.json({ data: { ok: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET /api/notifications/unread-count
async function unreadCount(req, res) {
  try {
    const count = await Notification.countDocuments({ user_id: req.user.id, read: false });
    res.json({ data: { count } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listNotifications, markRead, markAllRead, unreadCount };
