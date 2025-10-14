const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

router.use(checkAuth);

/* ===========================
   API: Card Management
=========================== */
// GET /api/cards/{cardId}
router.get('/:cardId', taskController.getCardDetails);

// PUT /api/cards/{cardId}
router.put('/:cardId', taskController.updateCard);

// DELETE /api/cards/{cardId}
router.delete('/:cardId', taskController.deleteCard);

// POST /api/cards/{cardId}/move
router.post('/:cardId/move', taskController.moveCard);

// POST /api/cards/{cardId}/toggle
router.post('/:cardId/toggle', taskController.toggleCardStatus);

module.exports = router;
