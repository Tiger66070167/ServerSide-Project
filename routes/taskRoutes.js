// routes/taskRoutes.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { checkAuth, setNoCache } = require('../middleware/authMiddleware');

// --- Main Task Dashboard ---
router.get('/', checkAuth, setNoCache, taskController.showTasks);

// --- Task Management ---
router.get('/new', checkAuth, taskController.showCreateForm);
router.post('/create', checkAuth, taskController.createTask);
router.get('/edit/:id', checkAuth, taskController.showEditForm);
router.post('/update/:id', checkAuth, taskController.updateTask);

// --- Archive ---
router.get('/archive', checkAuth, setNoCache, taskController.viewarchive);

// --- Subtask & Kanban Routes ---
router.get('/:id/board', checkAuth, taskController.showKanbanBoard);
router.post('/:id/lists/create', checkAuth, taskController.createList);
router.post('/lists/:listId/cards/create', checkAuth, taskController.createCard);
router.post('/cards/:cardId/move', checkAuth, taskController.moveCard);

module.exports = router;
