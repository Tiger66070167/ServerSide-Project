// controllers/authController.js
const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const multer = require('multer');
const path = require('path');

/* =================================
    MULTER CONFIGURATION
   ================================= */

// 1.1 กำหนดที่จัดเก็บไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/avatars/');
  },
  filename: function (req, file, cb) {
    const userId = req.cookies.user_id;
    if (!userId) {
      // เพิ่มการป้องกัน error กรณีไม่มี user_id
      return cb(new Error("User not authenticated for file upload"));
    }
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, userId + '-' + uniqueSuffix);
  }
});

// 1.2 สร้าง middleware ของ multer
const upload = multer({ storage: storage });
// -----------------------------------------------------------

/* =================================
    AUTH CONTROLLER METHODS
   ================================= */

exports.renderLogin = (req, res) => {
  res.render('login', { error: null, message: null });
};

exports.renderRegister = (req, res) => {
  res.render('register', { message: null, error: null });
};

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) {
    return res.render("register", { error: "All fields are required", message: null });
  }
  if (password !== confirmPassword) {
    return res.render("register", { error: "Passwords do not match", message: null });
  }
  if (password.length < 8 || password.length > 15) {
    return res.render("register", { error: "Password must be between 8 and 15 characters", message: null });
  }
  try {
    const existingUser = await userModel.findByUsernameOrEmail(username) || await userModel.findByUsernameOrEmail(email);
    if (existingUser) {
          if (!existingUser.is_verified) {
              await userModel.deleteUser(existingUser.user_id); 
          } else {
              return res.render("register", { error: "This Email is already registered.", message: null });
          }
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await userModel.createUser({ username, email, hashedPassword });
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await userModel.updateVerifyToken(email, token, expiry);
    const transporter = nodemailer.createTransport({
      service: "gmail", auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    const verifyLink = `http://localhost:3000/verify?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER, to: email, subject: 'Verify your email',
      html: `<p>Click the link to verify your email: <a href="${verifyLink}">${verifyLink}</a></p>`,
    });
    console.log("User registered with ID:", userId);
    res.render("login", { message: "Registration successful! Please check your email to verify your account.", error: null });
  } catch (err) {
    console.error("Register Error:", err.sqlMessage || err.message);
    res.render("register", { error: "Database error: " + (err.sqlMessage || err.message), message: null });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;
  const user = await userModel.findByUsernameOrEmail(login);
  if (!user) {
    return res.render('login', { error: 'Invalid Username or Email', message: null });
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.render('login', { error: 'Invalid Password', message: null });
  }
  if (!user.is_verified) {
    return res.render('login', { error: 'Please verify your email before logging in.', message: null });
  }
  res.cookie('user_id', user.user_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.redirect('/');
};

exports.logout = (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findByEmail(decoded.email);
    if (!user || user.verify_token !== token || new Date(user.verify_token_expiry) < new Date()) {
      return res.status(400).send('Invalid or expired verification link.');
    }
    await userModel.verifyUser(decoded.email);
    res.render('login', { message: 'Your email has been verified successfully! You can now log in.', error: null });
  } catch (err) {
    console.error("Verify Email Error:", err.message);
    res.status(400).send('Invalid or expired verification link.');
  }
};
// -----------------------------------------------------------

/* =================================
    USER PROFILE CONTROLLER METHODS
   ================================= */

exports.renderSettings = async (req, res) => {
  try {
    const user = await userModel.findById(req.cookies.user_id);
    if (!user) {
      res.clearCookie('user_id');
      return res.redirect('/login');
    }

    // รับ query params สำหรับแสดงข้อความ success/error
    const { update, error } = req.query;
    let message = null;
    let errorMessage = null;

    if (update === 'success') {
      message = 'Profile updated successfully!';
    }
    if (error) {
      errorMessage = error;
    }

    res.render('settings', { 
      user: user, 
      username: user.username, 
      currentPath: '/settings',
      message: message,
      error: errorMessage
    });
  } catch (err) {
    console.error("Error rendering settings page:", err.message);
    res.redirect('/');
  }
};

exports.updateUser = async (req, res) => {
    try {
        const userId = req.cookies.user_id;
        if (!userId) {
            return res.redirect('/login');
        }

        // 1. รับค่าจาก body เฉพาะ username เท่านั้น
        const { username } = req.body;

        // 2. สร้าง object สำหรับอัปเดตข้อมูล เริ่มต้นด้วย username
        const updateData = {
            username: username
        };

        // 3. ตรวจสอบว่ามีไฟล์ใหม่หรือไม่
        if (req.file) {
            //const avatarUrl = req.file.path.replace('public', '').replace(/\\/g, '/');
            //updateData.avatar_url = avatarUrl;

            // กรณีใช้ S3 ให้เก็บ URL ที่ได้จาก S3
            updateData.avatar_url = req.file.location;
        }
        
        // 4. เรียก Model พร้อมส่งข้อมูลที่กรองแล้ว
        await userModel.updateUserProfile(userId, updateData);

        return res.redirect('/settings?update=success');

    } catch (err) {
        console.error("!!! ERROR UPDATING USER PROFILE !!!", err);
        const errorMessage = encodeURIComponent(err.message);
        return res.redirect(`/settings?error=${errorMessage}`);
    }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.cookies.user_id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (newPassword !== confirmNewPassword) {
      return res.redirect('/settings');
    }
    const user = await userModel.findById(userId);
    if (!user) {
      return res.redirect('/login');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.redirect('/settings');
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await userModel.updatePassword(userId, hashedNewPassword);
    res.redirect('/settings');
  } catch (err) {
    console.error("Error changing password:", err.message);
    res.redirect('/settings');
  }
};

exports.deleteUser = async (req, res) => {
  const userId = req.cookies.user_id; 
  if (!userId) {
    return res.status(401).send('Unauthorized');
  }
  try {
    await userModel.deleteUser(userId);
    res.clearCookie('user_id');
    res.redirect('/register');
  } catch (err) {
    console.error("Delete User Error:", err.message);
    res.status(500).send('Error deleting user');
  }
};

exports.renderAbout = async (req, res) => {
  try {
    const user = await userModel.findById(req.cookies.user_id);
    if (!user) {
      return res.redirect('/login');
    }

    res.render('about', { username: user.username, user: user , currentPath: '/about'});
  } catch (err) {
    console.error("Error rendering about page:", err.message);
    res.redirect('/');
  }
};
