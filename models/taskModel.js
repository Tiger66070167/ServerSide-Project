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
    // ⭐️⭐️⭐️ แก้ไข SQL Query ทั้งหมด ⭐️⭐️⭐️
    let query = `
        SELECT 
            t.*,
            COUNT(sl.list_id) AS total_lists,
            SUM(CASE WHEN sl.is_done = 1 THEN 1 ELSE 0 END) AS done_lists
        FROM tasks t
        LEFT JOIN subtask_lists sl ON t.task_id = sl.task_id
        WHERE t.is_deleted = 0 AND t.user_id = ?
    `;
    const params = [user_id];

    // Filter by status
    if (status && status !== 'All') {
        query += ' AND t.status = ?';
        params.push(status);
    }

    // Filter by category
    if (category_id) {
        query += ' AND t.category_id = ?';
        params.push(category_id);
    }
    
    // Group by task to get correct counts
    query += ' GROUP BY t.task_id';

    // Sorting
    let orderByClause = ' ORDER BY t.created_at DESC'; // Default sort
    switch (sort) {
        case 'priority': orderByClause = ' ORDER BY t.priority ASC'; break;
        case 'due_date_asc': orderByClause = ' ORDER BY t.due_date ASC'; break;
        case 'due_date_desc': orderByClause = ' ORDER BY t.due_date DESC'; break;
        case 'az': orderByClause = ' ORDER BY t.title ASC'; break;
        case 'za': orderByClause = ' ORDER BY t.title DESC'; break;
    }
    query += orderByClause;

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

exports.recoverTask = async(id) => {
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
  await db.query(
    "UPDATE tasks SET status = 'completed', is_deleted = 1 WHERE task_id = ?", 
    [taskId]
  );
};

exports.getTaskById = async (id, includeDeleted = false) => {
  let sql = 'SELECT * FROM tasks WHERE task_id = ?';
  if (!includeDeleted) {
    sql += ' AND is_deleted = 0';
  }
  const [rows] = await db.query(sql, [id]);
  return rows[0];
};

exports.updateTaskStatus = async (taskId, newStatus) => {
  await db.query('UPDATE tasks SET status = ? WHERE task_id = ?', [newStatus, taskId]);
};
