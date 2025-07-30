const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
const categoryModel = require('../models/categoryModel')

exports.showTasks = async (req, res) => {
  const user = await userModel.findById(req.cookies.user_id);
  if (!user) return res.redirect('/login');

  const filter = req.query.status || 'All';
  const tasks = (filter === 'All')
    ? await taskModel.getAllTasks()
    : await taskModel.getTasksByStatus(filter);

  res.render('index', { tasks, username: user.username, filter });
};


exports.showCreateForm = async (req, res) => {
  const user_id = req.cookies.user_id;
  const categories = await categoryModel.getCategoriesByUser(user_id);
  res.render('pop-up/create', { categories });
};

exports.createTask = async (req, res) => {
  const { title, description, due_date, priority, status, category_id } = req.body;
  const user_id = req.cookies.user_id;

  await taskModel.createTask({
    title,
    description,
    due_date: due_date || null,
    priority,
    status,
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

exports.viewTrashCan = async (req, res) => {
  const tasks = await taskModel.getDeletedTasks();
  res.render('trashCan', { tasks });
};

exports.recoverTask = async (req, res) =>{
  await taskModel.recoverTasks(req.params.id);
  res.redirect('/tasks/trashCan')
}
