const expenseService = require('../services/expense.service');

async function list(req, res) {
  const result = await expenseService.list(req.user._id, req.validated.query);
  res.json({ success: true, data: result });
}

async function getOne(req, res) {
  const expense = await expenseService.getById(req.user._id, req.validated.params.id);
  res.json({ success: true, data: expense });
}

async function create(req, res) {
  const expense = await expenseService.create(req.user._id, req.validated.body);
  res.status(201).json({ success: true, data: expense });
}

async function update(req, res) {
  const expense = await expenseService.update(
    req.user._id,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ success: true, data: expense });
}

async function remove(req, res) {
  await expenseService.remove(req.user._id, req.validated.params.id);
  res.status(204).end();
}

async function exportCsv(req, res) {
  const csv = await expenseService.exportCsv(req.user._id, req.validated.query);
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="expenses-${date}.csv"`);
  // A BOM makes Excel open the file as UTF-8 (so symbols like ₹ show correctly).
  res.send(`\uFEFF${csv}`);
}

module.exports = { list, getOne, create, update, remove, exportCsv };
