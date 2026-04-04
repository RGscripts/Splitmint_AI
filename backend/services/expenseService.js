const { prisma } = require('../lib/prisma');
const { roundTo2 } = require('./balanceService');

/** Compute split amounts with proper rounding. Last share absorbs rounding difference. */
function computeSplits(total, mode, splits) {
  const amount = roundTo2(total);

  if (mode === 'equal') {
    const n = splits.length;
    const base = Math.floor((amount / n) * 100) / 100;
    const last = roundTo2(amount - base * (n - 1));
    return splits.map((s, i) => ({
      participantId: s.participantId,
      shareAmount: i === n - 1 ? last : base,
    }));
  }

  if (mode === 'percentage') {
    const totalPct = splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
    if (Math.abs(totalPct - 100) > 0.01)
      throw Object.assign(new Error('Percentages must sum to 100'), { status: 400 });
    let running = 0;
    return splits.map((s, i) => {
      if (i === splits.length - 1) return { participantId: s.participantId, shareAmount: roundTo2(amount - running) };
      const share = roundTo2((s.percentage / 100) * amount);
      running += share;
      return { participantId: s.participantId, shareAmount: share };
    });
  }

  if (mode === 'custom') {
    const totalCustom = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
    if (Math.abs(roundTo2(totalCustom) - amount) > 0.01)
      throw Object.assign(new Error('Custom split amounts must sum to total expense amount'), { status: 400 });
    let running = 0;
    return splits.map((s, i) => {
      if (i === splits.length - 1) return { participantId: s.participantId, shareAmount: roundTo2(amount - running) };
      const share = roundTo2(s.amount);
      running += share;
      return { participantId: s.participantId, shareAmount: share };
    });
  }

  throw Object.assign(new Error('Invalid split mode. Use equal, percentage, or custom'), { status: 400 });
}

async function validatePayerInGroup(groupId, payerId) {
  const participant = await prisma.participant.findFirst({ where: { id: payerId, groupId } });
  if (!participant) throw Object.assign(new Error('Payer must be a participant in the group'), { status: 400 });
}

async function validateSplitParticipants(groupId, splitParticipantIds) {
  const participants = await prisma.participant.findMany({ where: { groupId } });
  const validIds = new Set(participants.map((p) => p.id));
  for (const pid of splitParticipantIds) {
    if (!validIds.has(pid))
      throw Object.assign(new Error(`Participant ${pid} is not in this group`), { status: 400 });
  }
}

async function createExpense(userId, { groupId, amount, description, date, payerId, category, splitMode, splits }) {
  const group = await prisma.group.findFirst({ where: { id: groupId, createdBy: userId } });
  if (!group) throw Object.assign(new Error('Group not found'), { status: 404 });

  await validatePayerInGroup(groupId, payerId);
  await validateSplitParticipants(groupId, splits.map((s) => s.participantId));

  const computedSplits = computeSplits(amount, splitMode, splits);

  const expense = await prisma.expense.create({
    data: {
      amount: roundTo2(amount),
      description,
      date: new Date(date),
      category: category || 'Misc',
      payerId,
      groupId,
      splits: { create: computedSplits },
    },
    include: {
      splits: { include: { participant: true } },
      payer: true,
    },
  });
  return expense;
}

async function getExpenses(userId, filters = {}) {
  const { groupId, participantId, startDate, endDate, minAmount, maxAmount, search } = filters;

  const where = {
    group: { createdBy: userId },
    ...(groupId && { groupId }),
    ...(participantId && {
      OR: [
        { payerId: participantId },
        { splits: { some: { participantId } } },
      ],
    }),
    ...(startDate || endDate
      ? { date: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } }
      : {}),
    ...(minAmount !== undefined || maxAmount !== undefined
      ? { amount: { ...(minAmount !== undefined && { gte: Number(minAmount) }), ...(maxAmount !== undefined && { lte: Number(maxAmount) }) } }
      : {}),
    ...(search && { description: { contains: search, mode: 'insensitive' } }),
  };

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      splits: { include: { participant: true } },
      payer: true,
      group: true,
    },
    orderBy: { date: 'desc' },
  });
  return expenses;
}

async function updateExpense(expenseId, userId, { amount, description, date, payerId, category, splitMode, splits }) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, group: { createdBy: userId } },
  });
  if (!expense) throw Object.assign(new Error('Expense not found'), { status: 404 });

  const targetPayerId = payerId || expense.payerId;
  await validatePayerInGroup(expense.groupId, targetPayerId);

  const newAmount = amount !== undefined ? roundTo2(amount) : expense.amount;
  let computedSplits = null;
  if (splits && splitMode) {
    await validateSplitParticipants(expense.groupId, splits.map((s) => s.participantId));
    computedSplits = computeSplits(newAmount, splitMode, splits);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (computedSplits) {
      await tx.expenseSplit.deleteMany({ where: { expenseId } });
    }
    return tx.expense.update({
      where: { id: expenseId },
      data: {
        ...(amount !== undefined && { amount: newAmount }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(payerId !== undefined && { payerId }),
        ...(category !== undefined && { category }),
        ...(computedSplits && { splits: { create: computedSplits } }),
      },
      include: { splits: { include: { participant: true } }, payer: true },
    });
  });
  return updated;
}

async function deleteExpense(expenseId, userId) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, group: { createdBy: userId } },
  });
  if (!expense) throw Object.assign(new Error('Expense not found'), { status: 404 });
  // Splits are cascade-deleted via Prisma schema
  await prisma.expense.delete({ where: { id: expenseId } });
  return { message: 'Expense deleted successfully' };
}

module.exports = { createExpense, getExpenses, updateExpense, deleteExpense };
