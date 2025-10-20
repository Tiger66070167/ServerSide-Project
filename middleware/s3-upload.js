// middleware/s3-upload.js
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');

// --- 1. สร้าง S3 Client ---
const s3 = new S3Client({
  region: process.env.AWS_S3_REGION 
});

// --- 2. สร้าง File Filter (เลือกรับเฉพาะไฟล์รูปภาพ) ---
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
    cb(null, true);
  } else {
    // ถ้าไฟล์ไม่ตรง ให้ปฏิเสธ และส่ง error กลับไป
    cb(new Error('Invalid file type, only JPEG, PNG, or GIF is allowed!'), false);
  }
};

// --- 3. ตั้งค่า Multer-S3 Storage ---
const s3Storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME, // ชื่อ Bucket S3
  acl: 'public-read', // ตั้งค่าให้ไฟล์ที่อัปโหลดเป็น public
  metadata: (req, file, cb) => {
    // สามารถเพิ่ม metadata ให้ไฟล์ได้ (ถ้าต้องการ)
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    // ใช้ user_id จาก cookie เพื่อให้แน่ใจว่าไฟล์ไม่ซ้ำกัน
    const userId = req.cookies.user_id; 
    
    // สร้างชื่อไฟล์ใหม่: "avatars/[user_id]-[timestamp].[นามสกุล]"
    const fileName = `avatars/${userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  }
});

// --- 4. Export Multer instance ที่ตั้งค่าแล้ว ---
const uploadAvatar = multer({
  storage: s3Storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // จำกัดขนาดไฟล์ 5MB
  }
});

module.exports = uploadAvatar;
