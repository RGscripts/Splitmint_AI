const { prisma } = require('../lib/prisma');
const { validateParticipantLimit } = require('./groupService');
const { roundTo2 } = require('./balanceService');

function redistributeAmount(totalAmount, splitIds) {
  if (!splitIds.length) return [];

  const amount = roundTo2(totalAmount);
  const base = Math.floor((amount / splitIds.length) * 100) / 100;
  const last = roundTo2(amount - base * (splitIds.length - 1));

  return splitIds.map((id, index) => ({
    id,
    shareAmount: index === splitIds.length - 1 ? last : base,
  }));
}

async function addParticipant(groupId, userId, { name, color, avatar }) {
  // Verify group belongs to user
  const group = await prisma.group.findFirst({ where: { id: groupId, createdBy: userId } });
  if (!group) throw Object.assign(new Error('Group not found'), { status: 404 });

  await validateParticipantLimit(groupId);

  const participant = await prisma.participant.create({
    data: {
      name,
      color: color || '#6366f1',
      avatar: avatar || null,
      groupId,
    },
  });
  return participant;
}

async function updateParticipant(participantId, userId, { name, color, avatar }) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, group: { createdBy: userId } },
  });
  if (!participant) throw Object.assign(new Error('Participant not found'), { status: 404 });

  const updated = await prisma.participant.update({
    where: { id: participantId },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
      ...(avatar !== undefined && { avatar }),
    },
  });
  return updated;
}

async function deleteParticipant(participantId, userId) {
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, group: { createdBy: userId } },
    include: {
      group: {
        include: {
          participants: true,
        },
      },
    },
  });
  if (!participant) throw Object.assign(new Error('Participant not found'), { status: 404 });
  if (participant.isPrimary) {
    throw Object.assign(new Error('Primary user cannot be removed from the group'), { status: 400 });
  }

  const primaryParticipant = participant.group.participants.find((member) => member.isPrimary);
  if (!primaryParticipant) {
    throw Object.assign(new Error('Primary participant not found for group'), { status: 500 });
  }

  const relatedExpenses = await prisma.expense.findMany({
    where: {
      groupId: participant.groupId,
      OR: [
        { payerId: participantId },
        { splits: { some: { participantId } } },
      ],
    },
    include: {
      splits: {
        orderBy: { id: 'asc' },
      },
    },
  });

  await prisma.$transaction(async (tx) => {
    for (const expense of relatedExpenses) {
      const remainingSplits = expense.splits.filter((split) => split.participantId !== participantId);

      if (!remainingSplits.length) {
        await tx.expense.delete({ where: { id: expense.id } });
        continue;
      }

      const nextPayerId = expense.payerId === participantId ? primaryParticipant.id : expense.payerId;

      if (expense.splits.length !== remainingSplits.length) {
        await tx.expenseSplit.deleteMany({ where: { expenseId: expense.id } });
        await tx.expense.update({
          where: { id: expense.id },
          data: {
            payerId: nextPayerId,
            splits: {
              create: redistributeAmount(
                expense.amount,
                remainingSplits.map((split) => split.participantId)
              ).map((split) => ({
                participantId: split.id,
                shareAmount: split.shareAmount,
              })),
            },
          },
        });
        continue;
      }

      if (expense.payerId === participantId) {
        await tx.expense.update({
          where: { id: expense.id },
          data: { payerId: nextPayerId },
        });
      }
    }

    await tx.participant.delete({ where: { id: participantId } });
  });

  return { message: 'Participant deleted successfully' };
}

module.exports = { addParticipant, updateParticipant, deleteParticipant };
