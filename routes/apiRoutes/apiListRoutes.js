// routes/apiRoutes/apiListRoutes.js

const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

router.use(checkAuth);

// PUT /api/lists/{listId} -> This is the route you were missing!
router.put('/:listId', taskController.updateList);

// DELETE /api/lists/{listId}
router.delete('/:listId', taskController.deleteList);

// POST /api/lists/{listId}/complete
router.post('/:listId/complete', taskController.completeList);

// POST /api/lists/reorder -> NOTE: This route is special
router.post('/reorder', taskController.reorderLists);

// POST /api/lists/{listId}/cards -> creates a new card within this list
router.post('/:listId/cards', taskController.createCard);

module.exports = router;
