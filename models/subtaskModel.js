// models/subtaskModel.js
const db = require('../config/db');

// ดึง Subtasks ทั้งหมดของ Task ที่กำหนด
exports.getSubtasksByTaskId = async (taskId) => {
  const [rows] = await db.query('SELECT * FROM subtasks WHERE task_id = ? ORDER BY subtask_id ASC', [taskId]);
  return rows;
};

// สร้าง Subtask ใหม่
exports.createSubtask = async (description, taskId) => {
  const [result] = await db.query(
    'INSERT INTO subtasks (description, is_completed, task_id) VALUES (?, ?, ?)',
    [description, 0, taskId] // is_completed เริ่มต้นเป็น 0 (false)
  );
  return result.insertId;
};

// สลับสถานะ is_completed ของ Subtask (0 -> 1, 1 -> 0)
exports.toggleSubtaskStatus = async (subtaskId) => {
  await db.query(
    'UPDATE subtasks SET is_completed = !is_completed WHERE subtask_id = ?',
    [subtaskId]
  );
};

// ลบ Subtask
exports.deleteSubtask = async (subtaskId) => {
  await db.query('DELETE FROM subtasks WHERE subtask_id = ?', [subtaskId]);
};
