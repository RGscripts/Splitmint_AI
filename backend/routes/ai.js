const router = require('express').Router();
const auth = require('../middlewares/auth');
const { parseExpense, getSummary } = require('../controllers/aiController');

router.post('/parse-expense', auth, parseExpense);
router.post('/summary', auth, getSummary);

module.exports = router;
