const router = require('express').Router();
const auth = require('../middlewares/auth');
const { addParticipant, updateParticipant, deleteParticipant } = require('../controllers/participantController');

router.post('/', auth, addParticipant);
router.put('/:id', auth, updateParticipant);
router.delete('/:id', auth, deleteParticipant);

module.exports = router;
