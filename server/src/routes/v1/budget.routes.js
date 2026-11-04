const { Router } = require('express');
const validate = require('../../middleware/validate');
const { idParams } = require('../../validators/common');
const schema = require('../../validators/budget.validator');
const ctrl = require('../../controllers/budget.controller');

const router = Router();

router.get('/', validate({ query: schema.list }), ctrl.list);
router.put('/', validate({ body: schema.upsert }), ctrl.upsert);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
