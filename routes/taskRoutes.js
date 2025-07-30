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
router.get('/trashCan', taskController.viewTrashCan); // Go to trashcan
router.post('/recover/:id', taskController.recoverTask);


module.exports = router;
