const db = require('../config/db');

// Render Task //
exports.getAllTasks = async () => {
  const [rows] = await db.query('SELECT * FROM tasks where is_deleted = 0');
  return rows;
};

exports.getTaskById = async (id) => {
  const [rows] = await db.query('SELECT * FROM tasks WHERE task_id = ? and is_deleted = 0', [id]);
  return rows[0];
};

exports.updateTask = async (id, task) => {
  const { title, description, due_date, priority, status, category_id } = task;

  // Get current status
  const [rows] = await db.query('SELECT status FROM tasks WHERE task_id = ?', [id]);
  const currentStatus = rows[0]?.status;

  // If already completed, do not allow status change
  let newStatus = status;
  if (currentStatus === 'Completed') {
    newStatus = 'Completed';
  }

  await db.query(
    `UPDATE tasks 
     SET title = ?, description = ?, due_date = ?, priority = ?, status = ?, category_id = ?
     WHERE task_id = ? and is_deleted = 0`,
    [title, description, due_date, priority, newStatus, category_id, id]
  );
};

exports.getTasksByStatus = async (status) => {
  const [rows] = await db.query(
    'SELECT * FROM tasks WHERE status = ? AND is_deleted = 0',
    [status]
  );
  return rows;
};


exports.getDeletedTasks = async () => {
  const [rows] = await db.query(
    'SELECT * FROM tasks WHERE is_deleted = 1'
  );
  return rows;
};

exports.getFilteredAndSortedTasks = async (status, category_id, sort, user_id) => {
  let query = 'SELECT * FROM tasks WHERE is_deleted = 0 AND user_id = ?';
  const params = [user_id];

  // Filter by status
  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }

  // Filter by category
  if (category_id) {
    query += ' AND category_id = ?';
    params.push(category_id);
  }

  // Sorting
  switch (sort) {
    case 'priority':
      query += `
        ORDER BY
          CASE
            WHEN priority = 'high' THEN 1
            WHEN priority = 'medium' THEN 2
            WHEN priority = 'low' THEN 3
          END ASC
      `;
      break;
    case 'due_date_asc':
      query += ' ORDER BY due_date ASC';
      break;
    case 'due_date_desc':
      query += ' ORDER BY due_date DESC';
      break;
    case 'az':
      query += ' ORDER BY title ASC';
      break;
    case 'za':
      query += ' ORDER BY title DESC';
      break;
    default:
      query += ' ORDER BY created_at DESC';
  }

  const [rows] = await db.query(query, params);
  return rows;
};



// CRUD Task //

exports.createTask = async (task) => {
  const { title, description, due_date, priority, status, category_id, user_id } = task;

  await db.query(
    `INSERT INTO tasks (title, description, due_date, priority, status, created_at, category_id, user_id)
     VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)`,
    [title, description, due_date, priority, status, category_id, user_id]
  );
};

exports.softDeleteTask = async (id) => {
  await db.query(
    'update tasks set is_deleted = 1 WHERE task_id = ?', 
    [id]);
};

exports.deleteTask = async (id) => {
  await db.query('DELETE FROM tasks WHERE task_id = ?', [id]);
};

exports.recoverTasks = async(id) => {
    await db.query('update tasks set is_deleted = 0 where task_id = ?',
    [id]
  );
}

exports.getCardDetails = async (req, res) => {
  try {
    const { cardId } = req.params;
    const card = await subtaskModel.getCardById(cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.status(200).json(card);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card details' });
  }
};

exports.completeTask = async (taskId) => {
  await db.query("UPDATE tasks SET status = 'completed' WHERE task_id = ?", [taskId]);
};
