// middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตรวจสอบและสร้าง Directory ถ้ายังไม่มี
const uploadDir = 'public/images/avatars';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. กำหนดที่จัดเก็บและชื่อไฟล์ (Storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // ใช้ตัวแปรที่สร้างไว้
  },
  filename: function (req, file, cb) {
    const userId = req.cookies.user_id;
    if (!userId) {
      return cb(new Error("User not authenticated for file upload"));
    }
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกันแน่นอน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + userId + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. สร้าง Middleware ของ Multer พร้อม Validation
const upload = multer({
  storage: storage,
  // จำกัดขนาดไฟล์ (เช่น ไม่เกิน 2MB)
  limits: {
    fileSize: 2 * 1024 * 1024 
  },
  // กรองชนิดของไฟล์ (อนุญาตเฉพาะรูปภาพ)
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Error: File upload only supports the following filetypes - ' + filetypes));
  }
});

// 3. Export middleware สำหรับการอัปโหลดไฟล์เดียว
module.exports = upload.single('avatar'); // 'avatar' คือ name จาก <input>
