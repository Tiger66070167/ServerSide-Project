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

// เพิ่ม: หา user ด้วย email อย่างเดียว (จำเป็นสำหรับ verify)
exports.findByEmail = async (email) => {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    return rows[0];
};


// หา user โดย id
exports.findById = async (id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE user_id = ?',
    [id]
  );
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

exports.updateUser = (userId, userData) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET username = ?, email = ? WHERE user_id = ?';
    db.query(sql, [userData.username, userData.email, userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

exports.deleteUser = async (id) => {
  await pool.execute(
    'DELETE FROM users WHERE user_id = ?',
    [id]
  );
};

exports.updatePassword = (userId, hashedPassword) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE users SET password_hash = ? WHERE user_id = ?';
    db.query(sql, [hashedPassword, userId], (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
};

// ลบ user ที่ยังไม่ verify และ token หมดอายุไปแล้ว
// Use "Cron Job"
exports.deleteUnverifiedExpiredUsers = async () => {
  const [result] = await pool.execute(
    'DELETE FROM users WHERE is_verified = 0 AND verify_token_expiry < NOW()'
  );
  return result.affectedRows; // คืนค่าจำนวนแถวที่ถูกลบ
};
