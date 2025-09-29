// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { checkAuth, setNoCache } = require('../middleware/authMiddleware'); // (เราจะสร้างไฟล์นี้ต่อไป)

// --- Authentication Routes ---
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/logout', authController.logout);
router.get('/verify', authController.verifyEmail);

// --- User Settings & Profile Routes ---
router.get('/settings', checkAuth, setNoCache, authController.renderSettings);
router.post('/settings/update', checkAuth, authController.updateUser);
router.post('/settings/password', checkAuth, authController.changePassword);
router.post('/user/delete', checkAuth, authController.deleteUser);

// --- Static Pages ---
router.get('/about', checkAuth, setNoCache, authController.renderAbout);

module.exports = router;
