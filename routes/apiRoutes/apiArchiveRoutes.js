// routes/apiArchiveRoutes.js

const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

router.use(checkAuth);

/* ===========================
   API: Archive Management
=========================== */

// POST /api/archive/{id}/recover
router.post('/:id/recover', taskController.recoverTask);

// DELETE /api/archive/{id}
router.delete('/:id', taskController.deleteTask);

// Optional: Add a route to GET all archived tasks
// router.get('/', taskController.viewArchiveAPI); // You would need to create this controller

module.exports = router;