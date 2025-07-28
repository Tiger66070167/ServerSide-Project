const db = require('../config/db');

exports.getCategoriesByUser = async (user_id) => {
  const [rows] = await db.query('SELECT * FROM categories WHERE user_id = ?', [user_id]);
  return rows;
};
