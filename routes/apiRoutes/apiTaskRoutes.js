const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

router.use(checkAuth);

/* ===========================
   API: Task Management
=========================== */
// POST /api/tasks/
router.post('/', taskController.createTask);

// PUT /api/tasks/{id}
router.put('/:id', taskController.updateTask);

// POST /api/tasks/{id}/soft-delete
router.post('/:id/soft-delete', taskController.softDeleteTask);

// POST /api/tasks/{id}/complete
router.post('/:id/complete', taskController.completeTask);

// POST /api/tasks/{id}/lists -> creates a new list FOR a task
router.post('/:id/lists', taskController.createList);

module.exports = router;
