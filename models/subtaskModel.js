// models/subtaskModel.js
const db = require('../config/db');

// --- List Functions ---
exports.getListsByTaskId = async (taskId) => {
  const [lists] = await db.query('SELECT * FROM subtask_lists WHERE task_id = ? ORDER BY created_at ASC', [taskId]);
  return lists;
};

exports.createList = async (title, taskId) => {
  await db.query('INSERT INTO subtask_lists (title, task_id) VALUES (?, ?)', [title, taskId]);
};

// --- Card Functions ---
exports.getCardsByListId = async (listId) => {
  const [cards] = await db.query('SELECT * FROM subtask_cards WHERE list_id = ? ORDER BY created_at ASC', [listId]);
  return cards;
};

exports.createCard = async (description, listId) => {
  await db.query('INSERT INTO subtask_cards (description, list_id) VALUES (?, ?)', [description, listId]);
};

exports.moveCardToList = async (cardId, newListId) => {
  await db.query('UPDATE subtask_cards SET list_id = ? WHERE card_id = ?', [newListId, cardId]);
};
