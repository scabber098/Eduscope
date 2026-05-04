const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  listUniversities, platformStats, assignPlan, suspendUniversity, getAuditLogs
} = require('../controllers/adminController');

router.use(authRequired, requireAdmin);

router.get('/universities',           listUniversities);
router.get('/stats',                  platformStats);
router.patch('/universities/:id/plan',    assignPlan);
router.patch('/universities/:id/suspend', suspendUniversity);
router.get('/audit-logs',             getAuditLogs);

module.exports = router;
