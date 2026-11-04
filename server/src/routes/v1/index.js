const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth');

const router = Router();

router.use('/auth', require('./auth.routes'));

// Everything below requires an authenticated user.
router.use(requireAuth);
router.use('/expenses', require('./expense.routes'));
router.use('/categories', require('./category.routes'));
router.use('/budgets', require('./budget.routes'));
router.use('/analytics', require('./analytics.routes'));

module.exports = router;
