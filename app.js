const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const port = 3000;

const cron = require('node-cron');
const userModel = require('./models/userModel');

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// --- SWAGGER SETUP ---
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');

const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, './docs/swagger.yaml'), 'utf8')
);

const apiCategoryRoutes = require('./routes/apiRoutes/apiCategoryRoutes');
const apiTaskRoutes = require('./routes/apiRoutes/apiTaskRoutes');
const apiArchiveRoutes = require('./routes/apiRoutes/apiArchiveRoutes');
const apiListRoutes = require('./routes/apiRoutes/apiListRoutes');
const apiCardRoutes = require('./routes/apiRoutes/apiCardRoutes');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public'), { etag: false }));
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use('/', taskRoutes);
app.use('/', authRoutes);
app.use('/categories', categoryRoutes);

app.use('/api/categories', apiCategoryRoutes);
app.use('/api/tasks', apiTaskRoutes);
app.use('/api/archive', apiArchiveRoutes);
app.use('/api/lists', apiListRoutes);
app.use('/api/cards', apiCardRoutes);

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
