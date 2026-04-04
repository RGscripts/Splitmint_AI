const { mockParseExpense, generateSummary } = require('../services/aiService');

async function parseExpense(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'text is required' });
    const result = mockParseExpense(text);
    res.json({ success: true, result });
  } catch (err) { next(err); }
}

async function getSummary(req, res, next) {
  try {
    const summary = await generateSummary(req.user.userId);
    res.json({ success: true, summary });
  } catch (err) { next(err); }
}

module.exports = { parseExpense, getSummary };
