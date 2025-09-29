const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const port = 3000;

const cron = require('node-cron');
const userModel = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'), { etag: false }));
app.use(express.json());

// Routes
app.use('/', taskRoutes);
app.use('/', authRoutes);

// ตั้งเวลาให้ทำงานทุกๆ เที่ยงคืน
cron.schedule('0 0 * * *', async () => {
  console.log('Running a job to delete expired unverified users...');
  try {
    const deletedCount = await userModel.deleteUnverifiedExpiredUsers();
    console.log(`Successfully deleted ${deletedCount} unverified users.`);
  } catch (err) {
    console.error('Error during scheduled deletion of users:', err);
  }
}, {
  scheduled: true,
  timezone: "Asia/Bangkok"
});

// Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
