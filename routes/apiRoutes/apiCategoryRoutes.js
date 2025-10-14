// routes/apiCategoryRoutes.js

const express = require('express');
const router = express.Router();
const categoryController = require('../../controllers/categoryController');
const { checkAuth } = require('../../middleware/authMiddleware');

// === RESTful API Routes for Categories ===
// สังเกตว่าเราใช้ Controller เดิม ไม่ได้เขียนใหม่เลย

// GET /api/categories (ถ้าคุณต้องการฟังก์ชันดึงข้อมูลทั้งหมด)
// router.get('/', checkAuth, categoryController.getAllCategories); // <== คุณต้องไปสร้างฟังก์ชันนี้ใน Controller ถ้าต้องการ

// POST /api/categories
router.post('/', checkAuth, categoryController.createCategory);

// PUT /api/categories/:categoryId
router.put('/:categoryId', checkAuth, categoryController.updateCategory);

// DELETE /api/categories/:categoryId
router.delete('/:categoryId', checkAuth, categoryController.deleteCategory);

module.exports = router;