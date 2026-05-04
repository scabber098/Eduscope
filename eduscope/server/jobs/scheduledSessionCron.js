// jobs/scheduledSessionCron.js
// Requires: npm install node-cron
const cron = require('node-cron');
const ScheduledSession = require('../models/ScheduledSession');
const { getIO } = require('../socket');

function startScheduledSessionCron() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = Date.now();

      // Open sessions that have reached their scheduled_at time
      const toOpen = await ScheduledSession.find({
        status: 'pending',
        scheduled_at: { $lte: now },
      });
      for (const ss of toOpen) {
        const expiresAt = ss.scheduled_at + ss.duration_minutes * 60 * 1000;
        if (now < expiresAt) {
          ss.status = 'open';
          await ss.save();
          const io = getIO();
          if (io) io.to(`university:${ss.university_id}`).emit('scheduledSession:opened', { id: ss._id, title: ss.title });
          console.log(`[cron] ScheduledSession opened: ${ss._id}`);
        }
      }

      // Expire sessions past their end time
      const toExpire = await ScheduledSession.find({
        status: { $in: ['pending', 'open'] },
        $expr: {
          $lte: [
            { $add: ['$scheduled_at', { $multiply: ['$duration_minutes', 60000] }] },
            now,
          ],
        },
      });

      for (const ss of toExpire) {
        ss.status = 'expired';
        await ss.save();
        const io = getIO();
        if (io) io.to(`university:${ss.university_id}`).emit('scheduledSession:expired', { id: ss._id, title: ss.title });
        console.log(`[cron] ScheduledSession expired: ${ss._id}`);
      }
    } catch (err) {
      console.error('[cron] scheduledSessionCron error:', err.message);
    }
  });

  console.log('[cron] ScheduledSession cron started (every minute)');
}

module.exports = { startScheduledSessionCron };
