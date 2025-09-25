const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// render หน้า login
exports.renderLogin = (req, res) => {
  res.render('login', { error: null, message: null });
};

// render หน้า register
exports.renderRegister = (req, res) => {
  res.render('register', { message: null, error: null });
};

// register new user
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
    // Check for email or username already in existence
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

    // Create Token
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await userModel.updateVerifyToken(email, token, expiry);

    // Send Verification Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const verifyLink = `http://localhost:3000/verify?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email',
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
  
  // Render หน้า login พร้อม error message
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

  // Set cookie
  res.cookie('user_id', user.user_id, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
  res.redirect('/');
};


exports.logout = (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
};

exports.renderIndex = async (req, res) => {
  const user = await userModel.findById(req.cookies.user_id);
  if (!user) return res.redirect('/login');
  res.render('index', { username: user.username });
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

exports.renderSettings = async (req, res) => {
  try {

    const user = await userModel.findById(req.cookies.user_id);

    if (!user) {
      res.clearCookie('user_id');
      return res.redirect('/login');
    }
    res.render('settings', { 
        user: user, username: user.username
    });

  } catch (err) {
    console.error("Error rendering settings page:", err.message);
    res.redirect('/');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.cookies.user_id;
    const { username, email } = req.body;

    // การตรวจสอบข้อมูลเบื้องต้น
    if (!username || !email) {
      return res.redirect('/settings');
    }

    const userData = { username, email };

    await userModel.updateUser(userId, userData);

    res.redirect('/settings');

  } catch (err) {
    console.error("Error updating user:", err.message);
    res.redirect('/settings');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.cookies.user_id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // 1. ตรวจสอบว่ารหัสผ่านใหม่ตรงกัน
    if (newPassword !== confirmNewPassword) {
      // ควรส่ง error กลับไป
      return res.redirect('/settings');
    }

    // 2. ดึงข้อมูลผู้ใช้ (รวมถึงรหัสผ่านปัจจุบัน)
    const user = await userModel.findById(userId);
    if (!user) {
      return res.redirect('/login');
    }

    // 3. เปรียบเทียบรหัสผ่านปัจจุบัน
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      // รหัสผ่านปัจจุบันไม่ถูกต้อง
      return res.redirect('/settings'); // ควรส่ง error กลับไป
    }

    // 4. Hash รหัสผ่านใหม่
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 5. อัปเดตรหัสผ่านในฐานข้อมูล
    await userModel.updatePassword(userId, hashedNewPassword);

    // สำเร็จ!
    res.redirect('/settings'); // ควรส่งข้อความสำเร็จกลับไป

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
    // เนื่องจาก Route นี้ผ่าน checkAuth มาแล้ว เราจึงมั่นใจได้ว่ามี user_id
    const user = await userModel.findById(req.cookies.user_id);

    // ถ้าหา user ไม่เจอ (กรณีแปลกๆ) ก็ส่งกลับไปหน้า login
    if (!user) {
      return res.redirect('/login');
    }

    // Render หน้า about พร้อมส่ง username ไปให้ header
    res.render('about', { username: user.username });

  } catch (err) {
    console.error("Error rendering about page:", err.message);
    res.redirect('/');
  }
};
