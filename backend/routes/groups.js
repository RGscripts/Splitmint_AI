const router = require('express').Router();
const auth = require('../middlewares/auth');
const { createGroup, getGroups, getGroup, updateGroup, deleteGroup, getGroupSummary } = require('../controllers/groupController');

router.post('/', auth, createGroup);
router.get('/', auth, getGroups);
router.get('/:id', auth, getGroup);
router.put('/:id', auth, updateGroup);
router.delete('/:id', auth, deleteGroup);
router.get('/:id/summary', auth, getGroupSummary);

module.exports = router;
