// tests/category.api.test.js

const request = require('supertest');
const { app, scheduledTask } = require('../app');
const db = require('../config/db'); // 🎯 1. Import connection pool
const bcrypt = require('bcrypt');   // 🎯 2. Import bcrypt

// ===============================================================
//  เทสกลุ่มของ Category API
// ===============================================================
describe('Category API Endpoints', () => {

    // --- ตัวแปรกลางสำหรับใช้ในทุกเทส ---
    let cookie;
    let testUserId;
    const testUser = {
        email: `testuser_${Date.now()}@example.com`,
        username: `testuser_${Date.now()}`,
        password: 'password123'
    };
    let createdCategoryId; // เก็บ ID ของ category ที่สร้าง

    // ---------------------------------------------------------------
    // SETUP: รัน "ก่อน" ทุกๆ เทสในไฟล์นี้
    // ---------------------------------------------------------------
    beforeAll(async () => {
        // --- 1. สร้าง Test User ใน Database โดยตรง ---
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        const [result] = await db.query(
            'INSERT INTO users (username, email, password_hash, is_verified, created_at) VALUES (?, ?, ?, 1, NOW())',
            [testUser.username, testUser.email, hashedPassword]
        );
        testUserId = result.insertId;

        // --- 2. จำลองการล็อกอินด้วย User ที่เพิ่งสร้าง เพื่อเอา Cookie ---
        const loginResponse = await request(app)
            .post('/login')
            .send({
                login: testUser.email,
                password: testUser.password
            });
        
        cookie = loginResponse.headers['set-cookie'];
    });

    // ---------------------------------------------------------------
    // TEARDOWN: รัน "หลัง" จากทุกเทสในไฟล์นี้ทำงานจบแล้ว
    // ---------------------------------------------------------------
    afterAll(async () => {
        // --- ทำความสะอาด Database ---
        // ใช้ transaction เพื่อความปลอดภัย
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            // ลบข้อมูลที่เกี่ยวข้องก่อน (ถ้ามี Foreign Key)
            await connection.query('DELETE FROM tasks WHERE user_id = ?', [testUserId]);
            await connection.query('DELETE FROM categories WHERE user_id = ?', [testUserId]);
            // สุดท้าย ค่อยลบ User
            await connection.query('DELETE FROM users WHERE user_id = ?', [testUserId]);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            console.error("Error cleaning up test data:", err);
        } finally {
            connection.release();
        }

        // ปิด connection pool เพื่อให้ Jest ออกได้สนิท
        await db.end();
    });

    // ---------------------------------------------------------------
    // TEST CASES (เหมือนเดิม แต่ใช้ตัวแปรที่ Setup ไว้)
    // ---------------------------------------------------------------
    it('API-1: should create a new category when authenticated', async () => {
        const categoryName = `Test Category ${Date.now()}`;
        
        const res = await request(app)
            .post('/api/categories')
            .set('Cookie', cookie)
            .send({ name: categoryName });

        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('category_id');
        expect(res.body.name).toBe(categoryName);
        expect(res.body.user_id).toBe(testUserId);

        createdCategoryId = res.body.category_id; // เก็บ ID ไว้ใช้ต่อ
    });

    it('API-2: should return 401 Unauthorized when creating a category without a cookie', async () => {
        const res = await request(app)
            .post('/api/categories')
            .send({ name: 'Unauthorized Test' });
        
        expect(res.statusCode).toEqual(401);
    });

    it('API-3: should update an existing category', async () => {
        const updatedName = 'Updated Test Category';

        const res = await request(app)
            .put(`/api/categories/${createdCategoryId}`) // ใช้ ID ที่ได้จากเทสแรก
            .set('Cookie', cookie)
            .send({ name: updatedName });

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Category updated successfully');
    });
    
    it('API-4: should delete an existing category', async () => {
        const res = await request(app)
            .delete(`/api/categories/${createdCategoryId}`) // ใช้ ID เดิม
            .set('Cookie', cookie);

        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toBe('Category deleted successfully');
    });
});
