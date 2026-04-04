const router = require('express').Router();
const auth = require('../middlewares/auth');
const { createExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');

router.post('/', auth, createExpense);
router.get('/', auth, getExpenses);
router.put('/:id', auth, updateExpense);
router.delete('/:id', auth, deleteExpense);

module.exports = router;
