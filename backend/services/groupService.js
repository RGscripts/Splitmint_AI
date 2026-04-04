const { prisma } = require('../lib/prisma');
const { roundTo2 } = require('./balanceService');

const MAX_GROUP_MEMBERS = 4; // 3 participants + 1 primary user

function getPrimaryParticipantName(userName, email) {
  if (userName && String(userName).trim()) return String(userName).trim();
  const handle = (email || '').split('@')[0]?.trim();
  return handle || 'You';
}

async function createGroup(name, userId, userName, userEmail) {
  const group = await prisma.group.create({
    data: {
      name,
      createdBy: userId,
      participants: {
        create: {
          name: getPrimaryParticipantName(userName, userEmail),
          isPrimary: true,
          color: '#10b981',
        },
      },
    },
    include: { participants: true },
  });
  return group;
}

async function getGroups(userId) {
  const groups = await prisma.group.findMany({
    where: { createdBy: userId },
    include: {
      participants: true,
      _count: { select: { expenses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return groups;
}

async function getGroupById(groupId, userId) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, createdBy: userId },
    include: { participants: true },
  });
  if (!group) throw Object.assign(new Error('Group not found'), { status: 404 });
  return group;
}

async function updateGroup(groupId, userId, name) {
  await getGroupById(groupId, userId); // verify ownership
  const group = await prisma.group.update({
    where: { id: groupId },
    data: { name },
    include: { participants: true },
  });
  return group;
}

async function deleteGroup(groupId, userId) {
  await getGroupById(groupId, userId); // verify ownership

  // Manual cascade in correct order to avoid FK conflicts
  await prisma.$transaction(async (tx) => {
    await tx.expenseSplit.deleteMany({ where: { expense: { groupId } } });
    await tx.expense.deleteMany({ where: { groupId } });
    await tx.participant.deleteMany({ where: { groupId } });
    await tx.group.delete({ where: { id: groupId } });
  });

  return { message: 'Group deleted successfully' };
}

async function getGroupSummary(groupId, userId) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, createdBy: userId },
    include: {
      participants: true,
      expenses: { include: { splits: true } },
    },
  });
  if (!group) throw Object.assign(new Error('Group not found'), { status: 404 });

  const totalSpent = roundTo2(group.expenses.reduce((sum, e) => sum + e.amount, 0));

  const participantStats = group.participants.map((p) => {
    const totalPaid = roundTo2(
      group.expenses.filter((e) => e.payerId === p.id).reduce((sum, e) => sum + e.amount, 0)
    );
    const totalShare = roundTo2(
      group.expenses
        .flatMap((e) => e.splits)
        .filter((s) => s.participantId === p.id)
        .reduce((sum, s) => sum + s.shareAmount, 0)
    );
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isPrimary: p.isPrimary,
      totalPaid,
      totalShare,
      netBalance: roundTo2(totalPaid - totalShare),
    };
  });

  const primaryParticipant = participantStats.find((participant) => participant.isPrimary);
  const owedToUser = primaryParticipant?.netBalance > 0 ? primaryParticipant.netBalance : 0;
  const youOwe = primaryParticipant?.netBalance < 0 ? Math.abs(primaryParticipant.netBalance) : 0;

  return {
    group: { id: group.id, name: group.name },
    totalSpent,
    expenseCount: group.expenses.length,
    owedToUser: roundTo2(owedToUser),
    youOwe: roundTo2(youOwe),
    participants: participantStats,
  };
}

async function validateParticipantLimit(groupId) {
  const count = await prisma.participant.count({ where: { groupId } });
  if (count >= MAX_GROUP_MEMBERS) {
    throw Object.assign(
      new Error('Group can have at most 3 additional participants plus the primary user'),
      { status: 400 }
    );
  }
}

module.exports = { createGroup, getGroups, getGroupById, updateGroup, deleteGroup, getGroupSummary, validateParticipantLimit };
