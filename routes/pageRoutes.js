const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');

router.get('/about', pageController.renderAbout);         //go to about us pasge

module.exports = router;
