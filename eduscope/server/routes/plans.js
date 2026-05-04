const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { listPlans, createSubscription, mySubscription } = require('../controllers/planController');

router.get('/', listPlans);
router.post('/', authRequired, requireAdmin, createSubscription);

module.exports = router;
