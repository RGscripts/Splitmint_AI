const { prisma } = require('../lib/prisma');
const { roundTo2 } = require('./balanceService');

// ────────────────────────────────────────────────
// Auto-Categorization
// ────────────────────────────────────────────────
function categorize(text) {
  const t = text.toLowerCase();
  if (/dinner|lunch|breakfast|food|eat|coffee|pizza|restaurant|café|cafe|snack|meal|biryani|chai/.test(t)) return 'Food';
  if (/taxi|uber|ola|flight|bus|train|travel|trip|fuel|petrol|cab|auto|metro/.test(t)) return 'Travel';
  if (/rent|house|apartment|flat|pg|hostel|accommodation/.test(t)) return 'Rent';
  if (/movie|entertainment|game|ticket|show|concert|netflix|spotify/.test(t)) return 'Entertainment';
  if (/electricity|water|internet|wifi|bill|utility|gas/.test(t)) return 'Utilities';
  if (/medicine|doctor|hospital|pharmacy|health/.test(t)) return 'Health';
  return 'Misc';
}

// ────────────────────────────────────────────────
// Mock Natural Language Parser
// ────────────────────────────────────────────────
function mockParseExpense(text) {
  const errors = [];

  // Extract amount — first number found
  const amountMatch = text.match(/₹?\s*(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : null;
  if (!amount) errors.push('Could not extract amount');

  // Extract payer (word before "paid")
  const payerMatch = text.match(/([A-Za-z]+)\s+paid/i);
  const payerName = payerMatch ? payerMatch[1] : null;

  // Extract split type
  let splitMode = 'equal';
  if (/percent|%/.test(text)) splitMode = 'percentage';
  else if (/equal|equally/.test(text)) splitMode = 'equal';
  else if (/custom|each|respectively/.test(text)) splitMode = 'custom';

  const percentages = [...text.matchAll(/(\d+(?:\.\d{1,2})?)\s*%/g)].map((match) => parseFloat(match[1]));
  const allNumbers = [...text.matchAll(/₹?\s*(\d+(?:\.\d{1,2})?)/g)].map((match) => parseFloat(match[1]));
  const customAmounts = allNumbers.slice(1);

  // Extract number of people
  const peopleMatch =
    text.match(/among\s+(\d+)\s+(?:people|persons|of us)/i) ||
    text.match(/(\d+)\s+(?:people|persons|of us)/i) ||
    text.match(/split\s+(?:by|between)\s+(\d+)/i);
  const numPeople = peopleMatch ? parseInt(peopleMatch[1]) : null;

  // Extract description (text after "for")
  const descMatch = text.match(/for\s+([^,.\d]+?)(?:\s+split|\s+among|\s+between|$)/i);
  const description = descMatch ? descMatch[1].trim() : text.trim();

  const category = categorize(text);

  return {
    parsed: {
      amount,
      payerName,
      splitMode,
      numPeople,
      description,
      category,
      splits:
        splitMode === 'percentage' && percentages.length
          ? percentages.map((percentage) => ({ percentage }))
          : splitMode === 'custom' && customAmounts.length
            ? customAmounts.map((value) => ({ amount: value }))
            : [],
    },
    errors,
    raw: text,
  };
}

// ────────────────────────────────────────────────
// Summary Generator
// ────────────────────────────────────────────────
async function generateSummary(userId) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const groups = await prisma.group.findMany({
    where: { createdBy: userId },
    include: {
      participants: true,
      expenses: {
        where: { date: { gte: thirtyDaysAgo } },
        include: { splits: true },
        orderBy: { amount: 'desc' },
      },
    },
  });

  const allExpenses = groups.flatMap((g) => g.expenses);
  const totalSpent = roundTo2(allExpenses.reduce((sum, e) => sum + e.amount, 0));

  // Category breakdown
  const catMap = {};
  allExpenses.forEach((e) => {
    catMap[e.category] = roundTo2((catMap[e.category] || 0) + e.amount);
  });
  const topCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  // Biggest expense
  const biggest = allExpenses[0];

  const insights = [];
  if (totalSpent > 0) insights.push(`You spent a total of ₹${totalSpent} across ${groups.length} group(s) in the last 30 days.`);
  if (topCategory) insights.push(`Your highest spending category is ${topCategory[0]} (₹${topCategory[1]}).`);
  if (biggest) insights.push(`Biggest expense: "${biggest.description}" for ₹${biggest.amount}.`);
  if (allExpenses.length === 0) insights.push('No expenses recorded in the last 30 days.');

  return {
    totalSpent,
    expenseCount: allExpenses.length,
    groupCount: groups.length,
    categoryBreakdown: catMap,
    insights,
  };
}

module.exports = { mockParseExpense, generateSummary, categorize };
