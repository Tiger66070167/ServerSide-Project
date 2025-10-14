const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

router.use(checkAuth);

/* ===========================
   API: List Management
=========================== */
// PUT /api/lists/{listId}
router.put('/:listId', taskController.updateList);

// DELETE /api/lists/{listId}
router.delete('/:listId', taskController.deleteList);

// POST /api/lists/{listId}/complete
router.post('/:listId/complete', taskController.completeList);

// POST /api/lists/reorder
router.post('/reorder', taskController.reorderLists);

// POST /api/lists/{listId}/cards -> creates a new card FOR a list
router.post('/:listId/cards', taskController.createCard);

module.exports = router;
