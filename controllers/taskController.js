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
  const taskId = req.params.id;
  
  // 1. ดึงข้อมูล Task ปัจจุบันมาก่อน
  const currentTask = await taskModel.getTaskById(taskId);
  if (!currentTask) return res.status(404).send('Task not found');

  // 2. สร้าง object ข้อมูลใหม่ โดยใช้ข้อมูลปัจจุบันเป็นพื้นฐาน
  const updatedData = {
    title: req.body.title || currentTask.title,
    description: req.body.description || currentTask.description,
    due_date: req.body.due_date || currentTask.due_date,
    priority: req.body.priority || currentTask.priority,
    status: req.body.status || currentTask.status,
    category_id: req.body.category_id || currentTask.category_id,
  };

  // 3. ส่งข้อมูลที่สมบูรณ์ไปอัปเดต
  await taskModel.updateTask(taskId, updatedData);

  // 4. ตรวจสอบว่า request มาจาก AJAX หรือไม่
  if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
    // ถ้ามาจาก AJAX (Quick Actions), ตอบกลับเป็น JSON
    res.status(200).json({ message: 'Task updated successfully' });
  } else {
    // ถ้ามาจากฟอร์มปกติ (Detailed Edit), redirect
    res.redirect(`/${taskId}/board`);
  }
};

exports.deleteTask = async (req, res) => {
  await taskModel.deleteTask(req.params.id);
  res.redirect('/archive');
};

exports.softDeleteTask = async (req, res) => {
  await taskModel.softDeleteTask(req.params.id);
  res.redirect('/');
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
  await taskModel.recoverTask(req.params.id);
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

    if (!user) {
      return res.redirect('/login');
    }

    // ⭐️⭐️⭐️ 1. ดึงข้อมูลทั้งหมดที่จำเป็นพร้อมกัน ⭐️⭐️⭐️
    const [task, lists, categories] = await Promise.all([
      taskModel.getTaskById(taskId),
      subtaskModel.getListsByTaskId(taskId),
      categoryModel.getCategoriesByUser(user.user_id) // <-- ดึง Categories มาด้วย
    ]);

    if (!task) {
      return res.status(404).send('Task not found');
    }

    const listsWithCards = await Promise.all(
      lists.map(async (list) => {
        const cards = await subtaskModel.getCardsByListId(list.list_id);
        return { ...list, cards: cards };
      })
    );

    // ⭐️⭐️⭐️ 2. ส่ง categories เข้าไปใน res.render ⭐️⭐️⭐️
    res.render('kanban', {
      task,
      lists: listsWithCards,
      categories, // <-- ส่งตัวแปร categories ไปให้ EJS
      username: user.username
    });

  } catch (err) {
    console.error("Error showing Kanban board:", err.message);
    res.redirect('/');
  }
};

// 2. สร้าง List ใหม่
exports.createList = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // เราจะต้องแก้ไข model ให้ return list ที่สร้างใหม่กลับมาด้วย
    const newList = await subtaskModel.createList(title, taskId);

    // แทนที่จะ redirect, เราจะตอบกลับเป็น JSON ของ list ที่สร้างใหม่
    res.status(201).json(newList); // 201 Created

  } catch (err) {
    console.error("Error creating list:", err.message);
    res.status(500).json({ error: 'Failed to create list' });
  }
};

// 3. สร้าง Card ใหม่ใน List
exports.createCard = async (req, res) => {
  try {
    // ⭐️⭐️⭐️ เราจะใช้ listId จาก URL เท่านั้น ⭐️⭐️⭐️
    const { listId } = req.params; 
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // ส่งแค่ description และ listId ไปให้ Model ก็เพียงพอแล้ว
    const newCard = await subtaskModel.createCard(description, listId);

    res.status(201).json(newCard);

  } catch (err) {
    console.error("Error creating card:", err.message);
    res.status(500).json({ error: 'Failed to create card' });
  }
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

// --- List Management ---
exports.updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    await subtaskModel.updateListTitle(listId, title);
    res.status(200).json({ message: 'List updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update list' });
  }
};

exports.deleteList = async (req, res) => {
  try {
    const { listId } = req.params;
    await subtaskModel.deleteList(listId);
    res.status(200).json({ message: 'List deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete list' });
  }
};

// --- Card Management ---
exports.updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });
    await subtaskModel.updateCardDescription(cardId, description);
    res.status(200).json({ message: 'Card updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update card' });
  }
};

exports.deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    await subtaskModel.deleteCard(cardId);
    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
};

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

exports.reorderLists = async (req, res) => {
  try {
    const { listIds } = req.body; // รับ Array ของ list IDs ที่เรียงลำดับแล้ว
    if (!listIds || !Array.isArray(listIds)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }
    await subtaskModel.updateListOrder(listIds);
    res.status(200).json({ message: 'List order updated successfully' });
  } catch (err) {
    console.error("Error reordering lists:", err.message);
    res.status(500).json({ error: 'Failed to reorder lists' });
  }
};

exports.toggleCardStatus = async (req, res) => {
  try {
    const { cardId } = req.params;
    await subtaskModel.toggleCardStatus(cardId);
    // ตอบกลับข้อมูล card ที่อัปเดตแล้ว (เพื่อดึงสถานะ is_done ใหม่)
    const updatedCard = await subtaskModel.getCardById(cardId);
    res.status(200).json(updatedCard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle card status' });
  }
};

exports.completeList = async (req, res) => {
  try {
    const { listId } = req.params;
    // ตรวจสอบก่อนว่ามี card เหลืออยู่ไหม
    const remainingCards = await subtaskModel.getRemainingCardsInList(listId);
    if (remainingCards.length > 0) {
      return res.status(400).json({ error: 'Cannot complete list: some cards are still remaining.' });
    }
    await subtaskModel.completeList(listId);
    res.status(200).json({ message: 'List completed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete list' });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // ตรวจสอบฝั่งเซิร์ฟเวอร์ว่ามี list เหลืออยู่หรือไม่
    const remainingLists = await subtaskModel.getRemainingListsInTask(taskId);
    if (remainingLists.length > 0) {
      return res.status(400).json({ error: 'Cannot complete task: some lists are still remaining.' });
    }

    await taskModel.completeTask(taskId);
    res.status(200).json({ message: 'Task completed successfully' });

  } catch (err) {
    console.error("Error completing task:", err.message);
    res.status(500).json({ error: 'Failed to complete task' });
  }
};

exports.showRecoverConfirm = async (req, res) => {
  try {
    const task = await taskModel.getTaskById(req.params.id, true); // `true` เพื่อให้ดึง task ที่ถูกลบแล้วได้
    if (!task) return res.status(404).send('Task not found');
    res.render('pop-up/confirmRecover', { task });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

exports.showDeleteConfirm = async (req, res) => {
  try {
    const task = await taskModel.getTaskById(req.params.id, true);
    if (!task) return res.status(404).send('Task not found');
    res.render('pop-up/confirmDelete', { task });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
