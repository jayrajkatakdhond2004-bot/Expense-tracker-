const { Router } = require('express');
const validate = require('../../middleware/validate');
const { idParams } = require('../../validators/common');
const schema = require('../../validators/category.validator');
const ctrl = require('../../controllers/category.controller');

const router = Router();

router.get('/', ctrl.list);
router.post('/', validate({ body: schema.create }), ctrl.create);
router.patch('/:id', validate({ params: idParams, body: schema.update }), ctrl.update);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
