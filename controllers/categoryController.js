// controllers/categoryController.js
const categoryModel = require('../models/categoryModel');

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const user_id = req.cookies.user_id;

        if (!name || !user_id) {
            return res.status(400).json({ error: 'Category name and user ID are required.' });
        };

        const newCategory = await categoryModel.createCategory(user_id, name);
        res.status(201).json(newCategory);

    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params; // <-- ตรวจสอบว่าชื่อ parameter ตรงกับ Route
        const userId = req.cookies.user_id;

        if (!categoryId || !userId) {
            return res.status(400).json({ error: 'Missing required IDs for deletion.' });
        }

        // --- Debug Log ---
        console.log(`Attempting to delete Category ID: ${categoryId} for User ID: ${userId}`);
        
        await categoryModel.deleteCategory(categoryId, userId);
        
        console.log(`Successfully deleted Category ID: ${categoryId}`);
        res.status(200).json({ message: 'Category deleted successfully' });
        
    } catch (error) {
        // Log Error ทั้ง object
        console.error("--- ERROR DELETING CATEGORY ---");
        console.error("Timestamp:", new Date().toISOString());
        console.error("Requested Category ID:", req.params.categoryId);
        console.error("User ID from Cookie:", req.cookies.user_id);
        console.error("Full Error Object:", error); // <-- แสดง Error ทั้งหมด
        console.error("--- END OF ERROR REPORT ---");

        res.status(500).json({ error: 'Internal server error. Check server logs for details.' });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;
        const userId = req.cookies.user_id;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        await categoryModel.updateCategory(categoryId, name, userId);
        res.status(200).json({ message: 'Category updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update category' });
    }
};

