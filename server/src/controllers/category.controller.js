const categoryService = require('../services/category.service');

async function list(req, res) {
  res.json({ success: true, data: await categoryService.list(req.user._id) });
}

async function create(req, res) {
  const category = await categoryService.create(req.user._id, req.validated.body);
  res.status(201).json({ success: true, data: category });
}

async function update(req, res) {
  const category = await categoryService.update(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ success: true, data: category });
}

async function remove(req, res) {
  await categoryService.remove(req.user._id, req.validated.params.id);
  res.status(204).end();
}

module.exports = { list, create, update, remove };
