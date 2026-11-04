const { Router } = require('express');
const validate = require('../../middleware/validate');
const { idParams } = require('../../validators/common');
const schema = require('../../validators/expense.validator');
const ctrl = require('../../controllers/expense.controller');

const router = Router();

router.get('/', validate({ query: schema.list }), ctrl.list);
router.post('/', validate({ body: schema.create }), ctrl.create);
// Must be registered before "/:id" so "export" is not treated as an id.
router.get('/export', validate({ query: schema.filters }), ctrl.exportCsv);
router.get('/:id', validate({ params: idParams }), ctrl.getOne);
router.patch('/:id', validate({ params: idParams, body: schema.update }), ctrl.update);
router.delete('/:id', validate({ params: idParams }), ctrl.remove);

module.exports = router;
