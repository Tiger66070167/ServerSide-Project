const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Middleware
function checkAuth(req, res, next) {
  if (!req.cookies.user_id) return res.redirect('/login');
  next();
}

// Routes
router.get('/login', authController.renderLogin);         //login page
router.get('/register', authController.renderRegister);   //register page
router.post('/login', authController.login);              //check login input
router.post('/register', authController.register);        //check register input
router.get('/logout', authController.logout);             //Log out and clear cookies

const taskController = require('../controllers/taskController');
router.get('/', checkAuth, taskController.showTasks);     //Check if user login? and render Homepage

module.exports = router;
