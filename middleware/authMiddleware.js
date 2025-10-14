// middleware/authMiddleware.js
exports.checkAuth = (req, res, next) => {
    // ตรวจสอบว่ามี cookie หรือไม่
    if (req.cookies.user_id) {
        // ถ้ามี ให้ไปทำ middleware หรือ controller ตัวถัดไป
        return next();
    }

    // ถ้าไม่มี cookie, ให้ตรวจสอบว่าเป็น API request หรือไม่
    // เราจะเช็คว่า URL ขึ้นต้นด้วย '/api/' หรือไม่
    if (req.originalUrl.startsWith('/api/')) {
        // ถ้าใช่, นี่คือ API request
        // ให้ตอบกลับเป็น JSON พร้อม status 401 Unauthorized
        return res.status(401).json({ error: 'Authentication required. Please log in.' });
    } else {
        // ถ้าไม่ใช่, นี่คือ request จาก Web App ปกติ
        // ให้ redirect ไปยังหน้า login เหมือนเดิม
        return res.redirect('/login');
    }
};

exports.setNoCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};
