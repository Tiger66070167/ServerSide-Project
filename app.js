const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3000;

// Connect to database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PROT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// Set cookies
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Set Express to use EJS
app.set('view engine', 'ejs');

// Set static files
app.use(express.static('public'));

//Check if database is connected and Server Start
app.listen(port, async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Database connected successfully!');
    conn.release();
    console.log(`Server running at http://localhost:${port}`);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});


// get table fuction
async function getTasks() {
  const [tasks] = await pool.query('SELECT * FROM tasks');
  return tasks;
}
async function getUsers() {
  const [users] = await pool.query('SELECT * FROM users');
  return users;
}

// Middleware to check login
function checkAuth(req, res, next) {
  if (!req.cookies.user_id) return res.redirect('/login');
  next();
}

// Route Welcome!!!
app.get('/', checkAuth, async (req, res) => {
  const [rows] = await pool.query('SELECT username FROM users WHERE user_id = ?', [req.cookies.user_id]);
  if (rows.length === 0) return res.redirect('/login');
  res.render('index', { username: rows[0].username });
});
app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

// Logout
app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// Test dataconnect 
app.get('/test', async (req, res) => {
  try {
    const tasks = await getTasks();
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'เกี่ยวกับเรา' });
});

// Route Post
// Register
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.send('All fields are required');
  }

  if (password !== confirmPassword) {
    return res.send('Passwords do not match');
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, hashed]
    );
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('User already exists or Database error');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  const [rows] = await pool.query(
    'SELECT * FROM users WHERE username = ? or email = ?', 
    [login, login]);
  
  if (rows.length === 0) return res.send('Invalid credentials');

  const user = rows[0];

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.send('Invalid credentials');

  res.cookie('user_id', user.user_id, { httpOnly: true });
  res.redirect('/');
});

