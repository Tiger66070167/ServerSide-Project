// models/userModel.js
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

// อัปเดตข้อมูลโปรไฟล์ผู้ใช้ (เวอร์ชันไดนามิก)
exports.updateUserProfile = async (userId, updateData) => {
  // 1. ดึงชื่อ field ที่ต้องการอัปเดตออกมา (เช่น ['username', 'avatar_url'])
  const fields = Object.keys(updateData);

  // ป้องกันกรณีที่ไม่มีข้อมูลส่งมาให้อัปเดต
  if (fields.length === 0) {
    return; 
  }

  // 2. สร้างส่วน "SET" ของ SQL query แบบไดนามิก
  // ผลลัพธ์ที่ได้: "username = ?, avatar_url = ?"
  const setClause = fields.map(field => `${field} = ?`).join(', ');
  
  // 3. เตรียมค่าที่จะใส่เข้าไปใน query
  const values = fields.map(field => updateData[field]);
  
  // 4. เพิ่ม userId เป็นค่าสุดท้ายสำหรับ WHERE
  values.push(userId);

  // 5. สร้าง SQL query ที่สมบูรณ์
  const sql = `UPDATE users SET ${setClause} WHERE user_id = ?`;

  console.log("Executing Dynamic SQL:", sql);
  console.log("With Params:", values);

  try {
    const [result] = await pool.execute(sql, values);
    return result;
  } catch (dbError) {
    console.error("!!! DATABASE ERROR in updateUserProfile !!!", dbError);
    throw dbError; // โยน error ออกไปให้ controller จัดการ
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
