const { prisma } = require('../lib/prisma');

function roundTo2(num) {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Compute net balances for all participants in a group.
 * For each expense split where participant is NOT the payer:
 *   - participant owes payer that shareAmount
 *   - net[participant] -= shareAmount
 *   - net[payer]       += shareAmount
 */
async function computeGroupBalances(groupId) {
  const participants = await prisma.participant.findMany({ where: { groupId } });
  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: { splits: true },
  });

  const netBalance = {};
  participants.forEach((p) => { netBalance[p.id] = 0; });

  // Directional: directional[debtor][creditor] = amount debtor owes creditor
  const directional = {};
  participants.forEach((p) => {
    directional[p.id] = {};
    participants.forEach((other) => {
      if (p.id !== other.id) directional[p.id][other.id] = 0;
    });
  });

  for (const expense of expenses) {
    const payerId = expense.payerId;
    for (const split of expense.splits) {
      if (split.participantId !== payerId) {
        const amount = roundTo2(split.shareAmount);
        netBalance[split.participantId] = roundTo2((netBalance[split.participantId] || 0) - amount);
        netBalance[payerId] = roundTo2((netBalance[payerId] || 0) + amount);
        if (directional[split.participantId] && directional[split.participantId][payerId] !== undefined) {
          directional[split.participantId][payerId] = roundTo2(
            directional[split.participantId][payerId] + amount
          );
        }
      }
    }
  }

  const participantMap = {};
  participants.forEach((p) => { participantMap[p.id] = p; });

  const balances = participants.map((p) => ({
    participant: p,
    netBalance: roundTo2(netBalance[p.id] || 0),
  }));

  return { balances, directional, participantMap };
}

/**
 * Settlement minimization algorithm.
 * Matches largest debtor with largest creditor to minimize transactions.
 */
async function computeSettlements(groupId) {
  const { balances } = await computeGroupBalances(groupId);

  const creditors = balances
    .filter((b) => b.netBalance > 0.005)
    .map((b) => ({ id: b.participant.id, name: b.participant.name, amount: b.netBalance }));

  const debtors = balances
    .filter((b) => b.netBalance < -0.005)
    .map((b) => ({ id: b.participant.id, name: b.participant.name, amount: Math.abs(b.netBalance) }));

  const settlements = [];

  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort((a, b) => b.amount - a.amount);
    debtors.sort((a, b) => b.amount - a.amount);

    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = roundTo2(Math.min(creditor.amount, debtor.amount));

    settlements.push({
      from: debtor.id,
      fromName: debtor.name,
      to: creditor.id,
      toName: creditor.name,
      amount,
    });

    creditor.amount = roundTo2(creditor.amount - amount);
    debtor.amount = roundTo2(debtor.amount - amount);

    if (creditor.amount <= 0.005) creditors.shift();
    if (debtor.amount <= 0.005) debtors.shift();
  }

  return settlements;
}

module.exports = { computeGroupBalances, computeSettlements, roundTo2 };
