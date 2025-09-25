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

// Email verification
router.get('/verify', authController.verifyEmail);

// User settings
router.get('/settings', checkAuth, authController.renderSettings);
router.post('/settings/update', checkAuth, authController.updateUser);
router.post('/settings/password', checkAuth, authController.changePassword);
router.post('/user/delete', checkAuth, authController.deleteUser);

// About page
router.get('/about', checkAuth, authController.renderAbout); 

module.exports = router;
