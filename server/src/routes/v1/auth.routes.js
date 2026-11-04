const { Router } = require('express');
const validate = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');
const schema = require('../../validators/auth.validator');
const ctrl = require('../../controllers/auth.controller');

const router = Router();

router.post('/register', authLimiter, validate({ body: schema.register }), ctrl.register);
router.post('/login', authLimiter, validate({ body: schema.login }), ctrl.login);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
