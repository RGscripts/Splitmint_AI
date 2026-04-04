const router = require('express').Router();
const auth = require('../middlewares/auth');
const { getBalances, getSettlements } = require('../controllers/balanceController');

router.get('/:id/balances', auth, getBalances);
router.get('/:id/settlements', auth, getSettlements);

module.exports = router;
