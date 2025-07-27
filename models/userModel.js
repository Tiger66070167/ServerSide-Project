const db = require('../config/db');

module.exports = {
  async findByUsernameOrEmail(login) {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [login, login]
    );
    return rows[0];
  },

  async createUser({ username, email, hashedPassword }) {
    await db.query(
      'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())',
      [username, email, hashedPassword]
    );
  },

  async findById(userId) {
    const [rows] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    return rows[0];
  }
};
