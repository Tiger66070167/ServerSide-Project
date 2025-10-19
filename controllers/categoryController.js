// controllers/categoryController.js
const categoryModel = require('../models/categoryModel');

// --- Helper function to check if it's an API request ---
const isApiRequest = (req) => {
    return req.originalUrl.startsWith('/api/') || req.get('X-Requested-With') === 'XMLHttpRequest';
};
  

exports.createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        const user_id = req.cookies.user_id;

        if (!name || !user_id) {
            const error = 'Category name and user ID are required.';
            return isApiRequest(req) 
                ? res.status(400).json({ error })
                : res.redirect(`/?error=${encodeURIComponent(error)}`);
        }

        const newCategory = await categoryModel.createCategory(user_id, name);
        
        // MODIFIED: Respond based on request type
        if(isApiRequest(req)){
            res.status(201).json(newCategory);
        } else {
            res.redirect('/');
        }

    } catch (error) {
        console.error('Error creating category:', error);
        const errorMessage = 'Internal server error';
        if(isApiRequest(req)){
            res.status(500).json({ error: errorMessage });
        } else {
            res.redirect(`/?error=${encodeURIComponent(errorMessage)}`);
        }
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const userId = req.cookies.user_id;

        if (!categoryId || !userId) {
            const error = 'Missing required IDs for deletion.';
            return isApiRequest(req)
                ? res.status(400).json({ error })
                : res.redirect(`/?error=${encodeURIComponent(error)}`);
        }
        
        await categoryModel.deleteCategory(categoryId, userId);
        
        // MODIFIED: Respond based on request type
        if(isApiRequest(req)){
            res.status(200).json({ message: 'Category deleted successfully' });
        } else {
            res.redirect('/');
        }
        
    } catch (error) {
        console.error("--- ERROR DELETING CATEGORY ---", error);
        const errorMessage = 'Internal server error. Check server logs for details.';
        if(isApiRequest(req)){
            res.status(500).json({ error: errorMessage });
        } else {
            res.redirect(`/?error=${encodeURIComponent(errorMessage)}`);
        }
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name } = req.body;
        const userId = req.cookies.user_id;
        if (!name) {
             const error = 'Name is required';
             return isApiRequest(req)
                ? res.status(400).json({ error })
                : res.redirect(`/?error=${encodeURIComponent(error)}`);
        }

        await categoryModel.updateCategory(categoryId, name, userId);

        // MODIFIED: Respond based on request type
        if(isApiRequest(req)){
            res.status(200).json({ message: 'Category updated successfully' });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        const errorMessage = 'Failed to update category';
        if(isApiRequest(req)){
             res.status(500).json({ error: errorMessage });
        } else {
             res.redirect(`/?error=${encodeURIComponent(errorMessage)}`);
        }
    }
};
