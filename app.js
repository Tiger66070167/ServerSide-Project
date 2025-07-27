const express = require('express');
const mysql = require('mysql2/promise')
require('dotenv').config();
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

// Set Express to use EJS
app.set('view engine', 'ejs');

// Set static files
app.use(express.static('public'));

//Check if database is connected
app.listen(port, async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Database connected successfully!');
    conn.release();
  } catch (err) {
    console.error('Database connection failed:', err);
  }
});

// get tasks table fuction
async function getTasks() {
  const [tasks] = await pool.query('SELECT * FROM tasks');
  return tasks;
}

// Route
app.get('/', (req, res) => {
  res.render('index', { title: 'หน้าแรก' });
});

// Test dataconnect 
app.get('/test', async (req, res) => {
  try {
    const tasks = await getTasks();
    res.json(tasks); // Return as JSON
  } catch (err) {
    console.error(err);
    res.status(500).send('Database error');
  }
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'เกี่ยวกับเรา' });
});

// Server Start
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
