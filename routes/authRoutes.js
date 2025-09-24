const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware
function checkAuth(req, res, next) {
  if (!req.cookies.user_id) return res.redirect('/login');
  next();
}

// Routes
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);
router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/logout', authController.logout);

const taskController = require('../controllers/taskController');
router.get('/', checkAuth, taskController.showTasks);

// Test Section
router.get('/verify', authController.verifyEmail);
router.get('/delete', checkAuth, authController.deleteUser); // checkAuth จะทำให้เรามั่นใจว่ามี req.cookies.user_id

module.exports = router;
