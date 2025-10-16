// models/categoryModel.js
const db = require('../config/db');

exports.getCategoriesByUser = async (user_id) => {
  const [rows] = await db.query('SELECT * FROM categories WHERE user_id = ?', [user_id]);
  return rows;
};

exports.createCategory = async (user_id, name) => {
  const [result] = await db.query('INSERT INTO categories (user_id, name) VALUES (?, ?)', [user_id, name]);
  
  const [rows] = await db.query('SELECT * FROM categories WHERE category_id = ?', [result.insertId]);
  return rows[0];
}

exports.updateCategory = async (categoryId, name, userId) => {
    await db.query('UPDATE categories SET name = ? WHERE category_id = ? AND user_id = ?', [name, categoryId, userId]
    );
};

exports.deleteCategory = async (categoryId, userId) => {
    // ขั้นตอนที่ 1: อัปเดต Task ที่เกี่ยวข้องทั้งหมด
    // อัปเดตเฉพาะ Task ที่เป็นของ user คนนี้เท่านั้น
    await db.query(
        `UPDATE tasks 
         SET category_id = NULL 
         WHERE category_id = ? AND user_id = ?`,
        [categoryId, userId]
    );

    // ขั้นตอนที่ 2: ลบ Category หลังจากที่ Task ถูกปลดการเชื่อมโยงแล้ว
    await db.query(
        'DELETE FROM categories WHERE category_id = ? AND user_id = ?',
        [categoryId, userId]
    );
};

