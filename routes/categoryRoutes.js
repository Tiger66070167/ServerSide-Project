const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { checkAuth } = require('../middleware/authMiddleware');

/* ===========================
    Category Management     
=========================== */
router.post('/create', checkAuth, categoryController.createCategory);
router.post('/:categoryId/update', checkAuth, categoryController.updateCategory);
router.post('/:categoryId/delete', checkAuth, categoryController.deleteCategory);

module.exports = router;
