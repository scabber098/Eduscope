const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const {
  listNotifications, markRead, markAllRead, unreadCount
} = require('../controllers/notificationController');

router.use(authRequired);

router.get('/',              listNotifications);
router.get('/unread-count',  unreadCount);
router.patch('/read-all',    markAllRead);
router.patch('/:id/read',    markRead);

module.exports = router;
