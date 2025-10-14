// tests/task.api.test.js

const request = require('supertest');
const { app, scheduledTask } = require('../app');
const db = require('../config/db');
const bcrypt = require('bcrypt');

// ===============================================================
//  เทสกลุ่มของ Task API
// ===============================================================
describe('Task API Endpoints', () => {

    // --- ตัวแปรกลางสำหรับใช้ในทุกเทส ---
    let cookie;
    let testUserId;
    const testUser = {
        email: `tasktestuser_${Date.now()}@example.com`,
        username: `tasktestuser_${Date.now()}`,
        password: 'password123'
    };
    let testCategoryId; // ID ของ Category ที่เราจะสร้างเพื่อใช้ทดสอบ
    let createdTaskId;  // ID ของ Task ที่เราจะสร้าง

    // ---------------------------------------------------------------
    // SETUP: รัน "ก่อน" ทุกๆ เทสในไฟล์นี้
    // ---------------------------------------------------------------
    beforeAll(async () => {
        // --- 1. สร้าง Test User ใน Database ---
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        const [userResult] = await db.query(
            'INSERT INTO users (username, email, password_hash, is_verified) VALUES (?, ?, ?, 1)',
            [testUser.username, testUser.email, hashedPassword]
        );
        testUserId = userResult.insertId;

        // --- 2. สร้าง Test Category สำหรับ User นี้ ---
        const [categoryResult] = await db.query(
            'INSERT INTO categories (user_id, name) VALUES (?, ?)',
            [testUserId, 'Test Category for Tasks']
        );
        testCategoryId = categoryResult.insertId;

        // --- 3. ล็อกอินด้วย User ที่เพิ่งสร้าง เพื่อเอา Cookie ---
        const loginResponse = await request(app)
            .post('/login')
            .send({ login: testUser.email, password: testUser.password });
        
        cookie = loginResponse.headers['set-cookie'];
    });

    // ---------------------------------------------------------------
    // TEARDOWN: รัน "หลัง" จากทุกเทสในไฟล์นี้ทำงานจบแล้ว
    // ---------------------------------------------------------------
    afterAll(async () => {
        // --- ทำความสะอาด Database ---
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            await connection.query('DELETE FROM tasks WHERE user_id = ?', [testUserId]);
            await connection.query('DELETE FROM categories WHERE user_id = ?', [testUserId]);
            await connection.query('DELETE FROM users WHERE user_id = ?', [testUserId]);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            console.error("Error cleaning up task test data:", err);
        } finally {
            connection.release();
        } 
        
        if (scheduledTask) {
            scheduledTask.stop();
        }

        await db.end();
    });

    // ---------------------------------------------------------------
    // TEST CASES
    // ---------------------------------------------------------------

    it('API-5: should create a new task with a valid category', async () => {
        const taskData = {
            title: 'My First Test Task',
            priority: 'Medium',
            category_id: testCategoryId // ใช้ Category ID ที่เราสร้างไว้ใน beforeAll
        };

        const res = await request(app)
            .post('/api/tasks')
            .set('Cookie', cookie)
            .send(taskData);

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('task_id');
        expect(res.body.title).toBe(taskData.title);
        expect(res.body.user_id).toBe(testUserId);
        
        createdTaskId = res.body.task_id; // เก็บ ID ของ Task ไว้ใช้ในเทสถัดไป
    });

    it('API-6: should fail to create a task with a non-existent categoryId', async () => {
        const taskData = {
            title: 'Task with invalid category',
            priority: 'Low',
            category_id: 99999 // ID ที่ไม่มีอยู่จริง
        };

        const res = await request(app)
            .post('/api/tasks')
            .set('Cookie', cookie)
            .send(taskData);
        
        // เราคาดหวัง 400 Bad Request เพราะ Foreign Key constraint จะ fail
        expect(res.statusCode).toEqual(400); 
        expect(res.body.error).toContain('Invalid category_id');
    });

    it('API-7: should update an existing task', async () => {
        const updateData = {
            title: 'Updated Task Title',
            status: 'In Progress'
        };

        const res = await request(app)
            .put(`/api/tasks/${createdTaskId}`) // ใช้ ID ของ Task ที่เพิ่งสร้าง
            .set('Cookie', cookie)
            .send(updateData);

        expect(res.statusCode).toEqual(200);
        expect(res.body.title).toBe(updateData.title);
        expect(res.body.status).toBe(updateData.status);
    });

    // --- Bonus Test Cases (เกิน 7 ข้อ แต่เป็นประโยชน์) ---

    it('BONUS-1: should soft delete a task (move to archive)', async () => {
        const res = await request(app)
            .post(`/api/tasks/${createdTaskId}/soft-delete`)
            .set('Cookie', cookie);
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('moved to archive');

        // ตรวจสอบใน DB ว่า is_deleted เป็น 1 จริงหรือไม่
        const [rows] = await db.query('SELECT is_deleted FROM tasks WHERE task_id = ?', [createdTaskId]);
        expect(rows[0].is_deleted).toBe(1);
    });

    it('BONUS-2: should recover a task from the archive', async () => {
        const res = await request(app)
            .post(`/api/archive/${createdTaskId}/recover`)
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toContain('has been recovered');
        
        // ตรวจสอบใน DB ว่า is_deleted กลับมาเป็น 0 จริงหรือไม่
        const [rows] = await db.query('SELECT is_deleted FROM tasks WHERE task_id = ?', [createdTaskId]);
        expect(rows[0].is_deleted).toBe(0);
    });

});
