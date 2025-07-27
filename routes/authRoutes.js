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
router.get('/about', authController.renderAbout);
router.get('/', checkAuth, authController.renderHome);

module.exports = router;
