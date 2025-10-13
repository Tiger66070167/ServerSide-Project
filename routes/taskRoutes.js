// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { checkAuth, setNoCache } = require('../middleware/authMiddleware');

/* ===========================
   Main Task Dashboard
=========================== */
router.get('/', checkAuth, setNoCache, taskController.showTasks);

/* ===========================
   Task Management
=========================== */
router.get('/new', checkAuth, taskController.showCreateForm);
router.post('/create', checkAuth, taskController.createTask);
router.get('/edit/:id', checkAuth, taskController.showEditForm);
router.post('/update/:id', checkAuth, taskController.updateTask);
router.post('/toArchive/:id', checkAuth, taskController.softDeleteTask);

/* ===========================
   Archive
=========================== */
router.get('/archive', checkAuth, setNoCache, taskController.viewarchive);

/* ===========================
   Subtask & Kanban Routes
=========================== */
router.get('/:id/board', checkAuth, taskController.showKanbanBoard);
router.post('/:id/lists/create', checkAuth, taskController.createList);
router.post('/lists/:listId/cards/create', checkAuth, taskController.createCard);
router.post('/cards/:cardId/move', checkAuth, taskController.moveCard);

// List Management
router.post('/lists/:listId/update', checkAuth, taskController.updateList);
router.post('/lists/:listId/delete', checkAuth, taskController.deleteList);
router.post('/lists/reorder', checkAuth, taskController.reorderLists);
router.post('/lists/:listId/complete', checkAuth, taskController.completeList);

// Card Management
router.post('/cards/:cardId/update', checkAuth, taskController.updateCard);
router.post('/cards/:cardId/delete', checkAuth, taskController.deleteCard);
router.post('/cards/:cardId/toggle', checkAuth, taskController.toggleCardStatus);
router.get('/cards/:cardId', checkAuth, taskController.getCardDetails);

// Task Completion
router.post('/:taskId/complete', checkAuth, taskController.completeTask);

/* ===========================
   Recover & Delete (Confirm & Action)
=========================== */
// Recover
router.get('/recover/:id/confirm', checkAuth, taskController.showRecoverConfirm);
router.post('/recover/:id', checkAuth, taskController.recoverTask);

// Delete
router.get('/delete/:id/confirm', checkAuth, taskController.showDeleteConfirm);
router.post('/delete/:id', checkAuth, taskController.deleteTask);

module.exports = router;
