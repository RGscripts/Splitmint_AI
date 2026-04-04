const expenseService = require('../services/expenseService');

async function createExpense(req, res, next) {
  try {
    const { groupId, amount, description, date, payerId, category, splitMode, splits } = req.body;
    if (!groupId || !amount || !description || !date || !payerId || !splitMode || !splits?.length)
      return res.status(400).json({ success: false, message: 'groupId, amount, description, date, payerId, splitMode, and splits are required' });
    const expense = await expenseService.createExpense(req.user.userId, req.body);
    res.status(201).json({ success: true, expense });
  } catch (err) { next(err); }
}

async function getExpenses(req, res, next) {
  try {
    const expenses = await expenseService.getExpenses(req.user.userId, req.query);
    res.json({ success: true, expenses });
  } catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.user.userId, req.body);
    res.json({ success: true, expense });
  } catch (err) { next(err); }
}

async function deleteExpense(req, res, next) {
  try {
    const result = await expenseService.deleteExpense(req.params.id, req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };
