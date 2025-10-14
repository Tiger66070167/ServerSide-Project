// routes/apiTaskRoutes.js

const express = require('express');
const router = express.Router();
const taskController = require('../../controllers/taskController');
const { checkAuth } = require('../../middleware/authMiddleware');

/* ===============================================================
   === RESTful API for Tasks, Lists, and Cards ===
   =============================================================== */

// Middleware เพื่อตรวจสอบสิทธิ์สำหรับทุก Route ในไฟล์นี้
router.use(checkAuth);

/* ===========================
   API: Task Management
=========================== */
// GET /api/tasks  -> (ดึง Task ทั้งหมด - Controller Function นี้ยังไม่มี ต้องสร้างเพิ่มถ้าต้องการ)
// router.get('/', taskController.getAllTasksAPI); 

// POST /api/tasks -> สร้าง Task ใหม่ (จากข้อมูล JSON)
router.post('/', taskController.createTask);

// PUT /api/tasks/{id} -> อัปเดต Task
router.put('/:id', taskController.updateTask);

// POST /api/tasks/{id}/soft-delete -> ย้าย Task ไปที่ Archive
router.post('/:id/soft-delete', taskController.softDeleteTask);

// POST /api/tasks/{taskId}/complete -> เสร็จสิ้น Task
router.post('/:taskId/complete', taskController.completeTask);

/* ===========================
   API: Subtask & Kanban (Lists)
=========================== */
// POST /api/tasks/{id}/lists -> สร้าง List ใหม่ใน Task
router.post('/:id/lists', taskController.createList);

// PUT /api/lists/{listId} -> อัปเดตชื่อ List
router.put('/lists/:listId', taskController.updateList);

// DELETE /api/lists/{listId} -> ลบ List
router.delete('/lists/:listId', taskController.deleteList);

// POST /api/lists/reorder -> จัดลำดับ Lists ใหม่
router.post('/lists/reorder', taskController.reorderLists);

// POST /api/lists/{listId}/complete -> เสร็จสิ้น List
router.post('/lists/:listId/complete', taskController.completeList);


/* ===========================
   API: Subtask & Kanban (Cards)
=========================== */
// GET /api/cards/{cardId} -> ดูรายละเอียด Card
router.get('/cards/:cardId', taskController.getCardDetails);

// POST /api/lists/{listId}/cards -> สร้าง Card ใหม่ใน List
router.post('/lists/:listId/cards', taskController.createCard);

// PUT /api/cards/{cardId} -> อัปเดตรายละเอียด Card
router.put('/cards/:cardId', taskController.updateCard);

// DELETE /api/cards/{cardId} -> ลบ Card
router.delete('/cards/:cardId', taskController.deleteCard);

// POST /api/cards/{cardId}/move -> ย้าย Card ไปยัง List อื่น
router.post('/cards/:cardId/move', taskController.moveCard);

// POST /api/cards/{cardId}/toggle -> สลับสถานะของ Card (is_done)
router.post('/cards/:cardId/toggle', taskController.toggleCardStatus);


module.exports = router;
