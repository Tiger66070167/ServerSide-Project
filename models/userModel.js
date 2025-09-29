const pool = require('../config/db');

// สร้าง user
exports.createUser = async ({ username, email, hashedPassword }) => {
  const [result] = await pool.execute(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
    [username, email, hashedPassword]
  );
  return result.insertId;
};

// หา user โดย email หรือ username
exports.findByUsernameOrEmail = async (login) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
    [login, login]
  );
  return rows[0];
};

// หา user ด้วย email อย่างเดียว
exports.findByEmail = async (email) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0];
};

// หา user โดย id (ปรับปรุงเป็น async/await)
exports.findById = async (userId) => {
  const [rows] = await pool.execute('SELECT * FROM users WHERE user_id = ?', [userId]);
  return rows[0];
};

// อัปเดต token สำหรับ verify
exports.updateVerifyToken = async (email, token, expiry) => {
  await pool.execute(
    'UPDATE users SET verify_token = ?, verify_token_expiry = ? WHERE email = ?',
    [token, expiry, email]
  );
};

// ยืนยันอีเมล
exports.verifyUser = async (email) => {
  await pool.execute(
    'UPDATE users SET is_verified = 1, verify_token = NULL, verify_token_expiry = NULL WHERE email = ?',
    [email]
  );
};

// ลบ user
exports.deleteUser = async (id) => {
  await pool.execute(
    'DELETE FROM users WHERE user_id = ?',
    [id]
  );
};

// อัปเดตข้อมูลโปรไฟล์ผู้ใช้
exports.updateUserProfile = async (userId, userData) => {
  // ⭐️⭐️⭐️ เพิ่ม Log ที่นี่ ⭐️⭐️⭐️
  console.log("--- 3. INSIDE updateUserProfile MODEL ---");

  let sql = 'UPDATE users SET username = ?, email = ?';
  const params = [userData.username, userData.email];

  if (userData.avatarUrl) {
    sql += ', avatar_url = ?';
    params.push(userData.avatarUrl);
  }

  sql += ' WHERE user_id = ?';
  params.push(userId);

  console.log("Executing SQL:", sql);
  console.log("With Params:", params);

  // เราจะเปลี่ยนมาใช้ try...catch ที่นี่ เพื่อดักจับ Error จากฐานข้อมูล
  try {
    const [result] = await pool.execute(sql, params);
    console.log("SQL executed successfully. Result:", result);
    return result; // ส่งผลลัพธ์กลับไปให้ Controller
  } catch (dbError) {
    console.error("!!! DATABASE ERROR in updateUserProfile !!!", dbError);
    // **สำคัญ:** เมื่อเกิด error เราต้อง throw มันออกไป
    // เพื่อให้ try...catch ใน Controller สามารถจับได้
    throw dbError;
  }
};

// อัปเดตรหัสผ่าน
exports.updatePassword = async (userId, hashedPassword) => {
  const [result] = await pool.execute(
    'UPDATE users SET password_hash = ? WHERE user_id = ?',
    [hashedPassword, userId]
  );
  return result;
};

// ลบ user ที่ยังไม่ verify และ token หมดอายุไปแล้ว
exports.deleteUnverifiedExpiredUsers = async () => {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE is_verified = 0 AND verify_token_expiry < NOW()'
  );
  return result.affectedRows; // คืนค่าจำนวนแถวที่ถูกลบ
};
