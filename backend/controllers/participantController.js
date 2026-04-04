const participantService = require('../services/participantService');

async function addParticipant(req, res, next) {
  try {
    const { groupId, name, color, avatar } = req.body;
    if (!groupId || !name) return res.status(400).json({ success: false, message: 'groupId and name are required' });
    const participant = await participantService.addParticipant(groupId, req.user.userId, { name, color, avatar });
    res.status(201).json({ success: true, participant });
  } catch (err) { next(err); }
}

async function updateParticipant(req, res, next) {
  try {
    const participant = await participantService.updateParticipant(req.params.id, req.user.userId, req.body);
    res.json({ success: true, participant });
  } catch (err) { next(err); }
}

async function deleteParticipant(req, res, next) {
  try {
    const result = await participantService.deleteParticipant(req.params.id, req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { addParticipant, updateParticipant, deleteParticipant };
