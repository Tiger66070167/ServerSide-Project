const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
const categoryModel = require('../models/categoryModel')
const subtaskModel = require('../models/subtaskModel');

/* =================================
   TASK CONTROLLER METHODS
   ================================= */
exports.showTasks = async (req, res) => {
  const user = await userModel.findById(req.cookies.user_id);
  if (!user) return res.redirect('/login');

  const filter = req.query.status || 'All';
  const category_id = req.query.category_id || null;
  const sort = req.query.sort || null;

  const tasks = await taskModel.getFilteredAndSortedTasks(filter, category_id, sort, user.user_id);
  const categories = await categoryModel.getCategoriesByUser(user.user_id);

  res.render('index', { tasks, username: user.username, filter, categories, category_id, sort });
};

exports.showCreateForm = async (req, res) => {
  const user_id = req.cookies.user_id;
  const categories = await categoryModel.getCategoriesByUser(user_id);
  res.render('pop-up/create', { categories });
};

exports.createTask = async (req, res) => {
  const { title, description, due_date, priority, category_id } = req.body;
  const user_id = req.cookies.user_id;

  await taskModel.createTask({
    title,
    description,
    due_date: due_date || null,
    priority,
    status: 'pending', // Always pending on create
    category_id: category_id || null,
    user_id
  });

  res.redirect('/tasks');
};

exports.showEditForm = async (req, res) => {
  const user_id = req.cookies.user_id;
  const task_id = req.params.id;

  const task = await taskModel.getTaskById(task_id);
  const categories = await categoryModel.getCategoriesByUser(user_id);

  if (!task) return res.send('Task not found');

  res.render('pop-up/edit', { task, categories });
};

exports.updateTask = async (req, res) => {
  const task_id = req.params.id;
  const { title, description, due_date, priority, status, category_id } = req.body;

  await taskModel.updateTask(task_id, {
    title,
    description,
    due_date: due_date || null,
    priority,
    status,
    category_id: category_id || null
  });

  res.redirect('/tasks');
};

exports.deleteTask = async (req, res) => {
  await taskModel.deleteTask(req.params.id);
  res.redirect('/tasks');
};

exports.softDeleteTask = async (req, res) => {
  await taskModel.softDeleteTask(req.params.id);
  res.redirect('/tasks');
};

exports.viewarchive = async (req, res) => {
  const tasks = await taskModel.getDeletedTasks();
  try {
    if (req.cookies.user_id) {
        const user = await userModel.findById(req.cookies.user_id);
        if (user) {
            username = user.username;
        }
    }

  res.render('archive', { tasks, username });

  } catch (err) {
    console.error("Error rendering about page:", err.message);
    res.redirect('/');
  }
};

exports.recoverTask = async (req, res) =>{
  await taskModel.recoverTasks(req.params.id);
  res.redirect('/tasks/archive')
}

/* =================================
   SUBTASK CONTROLLER METHODS
   ================================= */

// 1. แสดงหน้ารายละเอียด Task และ Subtasks
exports.showSubtaskPage = async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = await userModel.findById(req.cookies.user_id);

    // ดึงข้อมูล Task หลัก และ Subtasks ทั้งหมดพร้อมกัน
    const [task, subtasks] = await Promise.all([
      taskModel.getTaskById(taskId),
      subtaskModel.getSubtasksByTaskId(taskId)
    ]);

    if (!task) {
      return res.status(404).send('Task not found');
    }

    // Render หน้าใหม่ที่เราจะสร้างขึ้น (subtask.ejs)
    res.render('subtask', { 
      task: task, 
      subtasks: subtasks, 
      username: user.username 
    });
  } catch (err) {
    console.error("Error showing subtask page:", err.message);
    res.redirect('/tasks');
  }
};

// 2. สร้าง Subtask ใหม่
exports.createSubtask = async (req, res) => {
  const taskId = req.params.id;
  const { description } = req.body;
  
  if (description) {
    await subtaskModel.createSubtask(description, taskId);
  }
  
  res.redirect(`/tasks/${taskId}/subtasks`);
};

// 3. สลับสถานะ Subtask (เสร็จ/ยังไม่เสร็จ)
exports.toggleSubtask = async (req, res) => {
  const { subtaskId } = req.params;
  const { taskId } = req.body; // เราจะส่ง taskId มาจากฟอร์มที่ซ่อนไว้
  
  await subtaskModel.toggleSubtaskStatus(subtaskId);
  
  res.redirect(`/tasks/${taskId}/subtasks`);
};

// 4. ลบ Subtask
exports.deleteSubtask = async (req, res) => {
  const { subtaskId } = req.params;
  const { taskId } = req.body;
  
  await subtaskModel.deleteSubtask(subtaskId);
  
  res.redirect(`/tasks/${taskId}/subtasks`);
};
