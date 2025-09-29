const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
const categoryModel = require('../models/categoryModel')
const subtaskModel = require('../models/subtaskModel');

/* =================================
   TASK CONTROLLER METHODS
   ================================= */
exports.showTasks = async (req, res) => {
  try {
    const user = await userModel.findById(req.cookies.user_id);

    if (!user) {
      res.clearCookie('user_id');
      return res.redirect('/login');
    }

    const filter = req.query.status || 'All';
    const category_id = req.query.category_id || null;
    const sort = req.query.sort || null;

    const tasks = await taskModel.getFilteredAndSortedTasks(filter, category_id, sort, user.user_id);
    const categories = await categoryModel.getCategoriesByUser(user.user_id);

    res.render('index', { tasks, user: user, username: user.username, filter, categories, category_id, sort });
  } catch (err) {
    console.error("Error in showTasks:", err);
    res.redirect('/login');
  }
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

  res.redirect('/');
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

  res.redirect('');
};

exports.deleteTask = async (req, res) => {
  await taskModel.deleteTask(req.params.id);
  res.redirect('');
};

exports.softDeleteTask = async (req, res) => {
  await taskModel.softDeleteTask(req.params.id);
  res.redirect('');
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
  res.redirect('/archive')
}
// -----------------------------------------------------------

/* =================================
   SUBTASK CONTROLLER METHODS
   ================================= */

// 1. แสดงหน้ารายละเอียด Task และ Subtasks
exports.showKanbanBoard = async (req, res) => {
  try {
    const taskId = req.params.id;
    const user = await userModel.findById(req.cookies.user_id);

    const task = await taskModel.getTaskById(taskId);
    if (!task) return res.status(404).send('Task not found');

    // 1. ดึง Lists ทั้งหมดของ Task นี้
    const lists = await subtaskModel.getListsByTaskId(taskId);

    // 2. สำหรับแต่ละ List, ดึง Cards ทั้งหมดที่อยู่ใน List นั้น
    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const cards = await subtaskModel.getCardsByListId(list.list_id);
        return { ...list, cards: cards }; // trả về object list mới có thêm thuộc tính cards
      })
    );

    res.render('kanban', { task, lists: listsWithCards, user: user, username: user.username });

  } catch (err) {
    console.error("Error showing Kanban board:", err.message);
    res.redirect('');
  }
};

// 2. สร้าง List ใหม่
exports.createList = async (req, res) => {
  const taskId = req.params.id;
  const { title } = req.body;
  if (title) {
    await subtaskModel.createList(title, taskId);
  }
  res.redirect(`/${taskId}/board`);
};

// 3. สร้าง Card ใหม่ใน List
exports.createCard = async (req, res) => {
  const { listId } = req.params;
  const { description, taskId } = req.body;
  if (description) {
    await subtaskModel.createCard(description, listId);
  }
  res.redirect(`/${taskId}/board`);
};

// 4. ย้าย Card ไปยัง List อื่น
exports.moveCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { newListId } = req.body;
    await subtaskModel.moveCardToList(cardId, newListId);
    // ส่งสถานะ 200 OK กลับไปให้ JavaScript (fetch)
    res.status(200).json({ message: 'Card moved successfully' });
  } catch (err) {
    console.error("Error moving card:", err.message);
    res.status(500).json({ error: 'Failed to move card' });
  }
};
