const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const port = 3000;

const authRoutes = require('./routes/authRoutes');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.use('/', authRoutes);

// Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
