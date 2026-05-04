const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const { createSubscription, mySubscription } = require('../controllers/planController');

router.post('/', authRequired, requireAdmin, createSubscription);
router.get('/my', authRequired, mySubscription);

module.exports = router;
