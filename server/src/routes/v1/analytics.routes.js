const { Router } = require('express');
const validate = require('../../middleware/validate');
const schema = require('../../validators/analytics.validator');
const ctrl = require('../../controllers/analytics.controller');

const router = Router();

router.get('/summary', validate({ query: schema.monthQuery }), ctrl.summary);
router.get('/by-category', validate({ query: schema.monthQuery }), ctrl.byCategory);
router.get('/trend', validate({ query: schema.trend }), ctrl.trend);

module.exports = router;
