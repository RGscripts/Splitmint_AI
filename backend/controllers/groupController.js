const groupService = require('../services/groupService');

async function createGroup(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });
    const group = await groupService.createGroup(name, req.user.userId, req.user.name, req.user.email);
    res.status(201).json({ success: true, group });
  } catch (err) { next(err); }
}

async function getGroups(req, res, next) {
  try {
    const groups = await groupService.getGroups(req.user.userId);
    res.json({ success: true, groups });
  } catch (err) { next(err); }
}

async function getGroup(req, res, next) {
  try {
    const group = await groupService.getGroupById(req.params.id, req.user.userId);
    res.json({ success: true, group });
  } catch (err) { next(err); }
}

async function updateGroup(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Group name is required' });
    const group = await groupService.updateGroup(req.params.id, req.user.userId, name);
    res.json({ success: true, group });
  } catch (err) { next(err); }
}

async function deleteGroup(req, res, next) {
  try {
    const result = await groupService.deleteGroup(req.params.id, req.user.userId);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getGroupSummary(req, res, next) {
  try {
    const summary = await groupService.getGroupSummary(req.params.id, req.user.userId);
    res.json({ success: true, summary });
  } catch (err) { next(err); }
}

module.exports = { createGroup, getGroups, getGroup, updateGroup, deleteGroup, getGroupSummary };
