const express = require('express');
const app = express();
const port = 3000;

// ตั้งค่าให้ Express ใช้ EJS เป็น template engine
app.set('view engine', 'ejs');

// ตั้งค่า static files
app.use(express.static('public'));

// Route หลัก
app.get('/', (req, res) => {
  res.render('index', { title: 'หน้าแรก' });
});

app.get('/about', (req, res) => {
  res.render('about', { title: 'เกี่ยวกับเรา' });
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
