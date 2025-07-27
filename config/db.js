const mysql = require('mysql2/promise');
require('dotenv').config();

// Connect to database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PROT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

module.exports = pool;