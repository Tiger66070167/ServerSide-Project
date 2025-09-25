const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/', taskController.showTasks);             // List all tasks
router.get('/new', taskController.showCreateForm);     // Show new task form
router.post('/create', taskController.createTask);     // Create task
router.get('/edit/:id', taskController.showEditForm);  // Show edit form
router.post('/update/:id', taskController.updateTask); // Update task
router.post('/softDeleteTask/:id', taskController.softDeleteTask); // softDelete task
router.post('/delete/:id', taskController.deleteTask); // Delete task
router.get('/archive', taskController.viewarchive); // Go to archive
router.post('/recover/:id', taskController.recoverTask);

router.get('/:id/subtasks', taskController.showSubtaskPage);

router.get('/edit/:id', taskController.showEditForm);
router.post('/update/:id', taskController.updateTask);

router.post('/:id/subtasks/create', taskController.createSubtask);
router.post('/subtasks/:subtaskId/toggle', taskController.toggleSubtask);
router.post('/subtasks/:subtaskId/delete', taskController.deleteSubtask);


module.exports = router;
