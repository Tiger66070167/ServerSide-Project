// models/subtaskModel.js
const db = require('../config/db');

// --- List Functions ---
exports.getListsByTaskId = async (taskId) => {
  const [lists] = await db.query('SELECT * FROM subtask_lists WHERE task_id = ? ORDER BY order_index ASC', [taskId]);
  return lists || [];
};

exports.createList = async (title, taskId) => {
  // 1. Insert ข้อมูลใหม่
  const [result] = await db.query(
    'INSERT INTO subtask_lists (title, task_id) VALUES (?, ?)', 
    [title, taskId]
  );
  
  const insertId = result.insertId;

  // 2. ดึงข้อมูลที่เพิ่ง insert กลับมาทั้งหมด
  const [rows] = await db.query('SELECT * FROM subtask_lists WHERE list_id = ?', [insertId]);
  
  // 3. คืนค่า object ของ list ใหม่
  return rows[0];
};

// --- Card Functions ---
exports.getCardsByListId = async (listId) => {
  const [cards] = await db.query('SELECT * FROM subtask_cards WHERE list_id = ? ORDER BY created_at ASC', [listId]);
  return cards;
};

// --- Card Management Functions ---
exports.createCard = async (description, listId) => {
  // 1. Insert ข้อมูล card ใหม่
  const [result] = await db.query(
    'INSERT INTO subtask_cards (description, list_id) VALUES (?, ?)',
    [description, listId]
  );
  
  const insertId = result.insertId;

  // 2. ดึงข้อมูล card ที่เพิ่งสร้างกลับมาทั้งหมด
  const [rows] = await db.query('SELECT * FROM subtask_cards WHERE card_id = ?', [insertId]);
  
  // 3. คืนค่า object ของ card ใหม่กลับไปให้ Controller
  return rows[0];
};

exports.moveCardToList = async (cardId, newListId) => {
  await db.query('UPDATE subtask_cards SET list_id = ? WHERE card_id = ?', [newListId, cardId]);
};

exports.updateListTitle = async (listId, newTitle) => {
  await db.query('UPDATE subtask_lists SET title = ? WHERE list_id = ?', [newTitle, listId]);
};

exports.deleteList = async (listId) => {
  // ลบ List และ Card ที่เกี่ยวข้องทั้งหมด
  await db.query('DELETE FROM subtask_lists WHERE list_id = ?', [listId]);
};

// --- Card Functions (เพิ่มเติม) ---
exports.updateCardDescription = async (cardId, newDescription) => {
  await db.query('UPDATE subtask_cards SET description = ? WHERE card_id = ?', [newDescription, cardId]);
};

exports.deleteCard = async (cardId) => {
  await db.query('DELETE FROM subtask_cards WHERE card_id = ?', [cardId]);
};

exports.getCardById = async (cardId) => {
  const [rows] = await db.query('SELECT * FROM subtask_cards WHERE card_id = ?', [cardId]);
  return rows[0]; // คืนค่าข้อมูลของ card ใบนั้น
};

exports.updateListOrder = async (listOrder) => {
  // listOrder ควรเป็น array ของ listId ที่เรียงลำดับตามที่ต้องการ
  const promises = listOrder.map((listId, index) => {
    return db.query('UPDATE subtask_lists SET order_index = ? WHERE list_id = ?', [index, listId]);
  });
  await Promise.all(promises);
};

exports.toggleCardStatus = async (cardId) => {
  await db.query('UPDATE subtask_cards SET is_done = !is_done WHERE card_id = ?', [cardId]);
};

exports.completeList = async (listId) => {
  await db.query('UPDATE subtask_lists SET is_done = TRUE WHERE list_id = ?', [listId]);
};

// ใช้สำหรับตรวจสอบก่อนที่จะ complete list
exports.getRemainingCardsInList = async (listId) => {
  const [rows] = await db.query('SELECT card_id FROM subtask_cards WHERE list_id = ? AND is_done = FALSE', [listId]);
  return rows;
};

exports.getRemainingListsInTask = async (taskId) => {
  const [rows] = await db.query('SELECT list_id FROM subtask_lists WHERE task_id = ? AND is_done = FALSE', [taskId]);
  return rows;
};
