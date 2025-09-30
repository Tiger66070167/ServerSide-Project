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
router.post('/lists/:listId/cards/create', checkAuth, taskController.createCard);

// แก้ไข List (PUT/PATCH เป็น method ที่เหมาะสมกว่า แต่ POST ก็ใช้ได้)
router.post('/lists/:listId/update', checkAuth, taskController.updateList); 
// ลบ List
router.post('/lists/:listId/delete', checkAuth, taskController.deleteList);

// แก้ไข Card
router.post('/cards/:cardId/update', checkAuth, taskController.updateCard);
// ลบ Card
router.post('/cards/:cardId/delete', checkAuth, taskController.deleteCard);


module.exports = router;
