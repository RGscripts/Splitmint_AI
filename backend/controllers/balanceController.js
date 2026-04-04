const { computeGroupBalances, computeSettlements } = require('../services/balanceService');
const { prisma } = require('../lib/prisma');

async function getBalances(req, res, next) {
  try {
    const group = await prisma.group.findFirst({ where: { id: req.params.id, createdBy: req.user.userId } });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const { balances, directional, participantMap } = await computeGroupBalances(req.params.id);
    res.json({ success: true, balances, directional, participantMap });
  } catch (err) { next(err); }
}

async function getSettlements(req, res, next) {
  try {
    const group = await prisma.group.findFirst({ where: { id: req.params.id, createdBy: req.user.userId } });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    const settlements = await computeSettlements(req.params.id);
    res.json({ success: true, settlements });
  } catch (err) { next(err); }
}

module.exports = { getBalances, getSettlements };
