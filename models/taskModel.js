const db = require('../config/db');

exports.getAllTasks = async () => {
  const [rows] = await db.query('SELECT * FROM tasks');
  return rows;
};

exports.createTask = async (task) => {
  const { title, description, due_date, priority, status, category_id, user_id } = task;

  await db.query(
    `INSERT INTO tasks (title, description, due_date, priority, status, created_at, category_id, user_id)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [title, description, due_date, priority, status, category_id, user_id]
  );
};

exports.getTaskById = async (id) => {
  const [rows] = await db.query('SELECT * FROM tasks WHERE task_id = ?', [id]);
  return rows[0];
};

exports.updateTask = async (id, task) => {
  const { title, description, due_date, priority, status, category_id } = task;

  await db.query(
    `UPDATE tasks 
     SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, category_id = ?
     WHERE task_id = ?`,
    [title, description, due_date, priority, status, category_id, id]
  );
};

exports.deleteTask = async (id) => {
  await db.query('DELETE FROM tasks WHERE task_id = ?', [id]);
};
