const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

// redner หน้า login
exports.renderLogin = (req, res) => {
  res.render('login', { error: null });
};

// render หน้า register
exports.renderRegister = (req, res) => {
  res.render('register', { message: null });
};

// register new user
exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.render("register", { message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.render("register", { message: "Passwords do not match" });
  }

  try {
    // Check for email or username already in existence
    const existingUser = await userModel.findByUsernameOrEmail(username) || await userModel.findByUsernameOrEmail(email);
    if (existingUser) {
      // ถ้า user มีอยู่แล้ว และยังไม่เคยยืนยันตัวตน
          if (!existingUser.is_verified) {
              // ลบของเก่าทิ้ง แล้วสร้างใหม่ทั้งหมด
              await userModel.deleteUser(existingUser.user_id); 
          } else {
              // ถ้า user มีอยู่และยืนยันตัวตนแล้ว
              return res.render("register", { message: "This Email is already registered." });
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
    // Render หน้า login พร้อมข้อความแจ้งให้ตรวจสอบอีเมล
    res.render("login", { error: "Registration successful! Please check your email to verify your account." });
  } catch (err) {
    console.error("Register Error:", err.sqlMessage || err.message);
    res.render("register", { message: "Database error: " + (err.sqlMessage || err.message) });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;
  const user = await userModel.findByUsernameOrEmail(login);
  
  // Render หน้า login พร้อม error message
  if (!user) {
    return res.render('login', { error: 'Invalid Username or Email' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.render('login', { error: 'Invalid Password' });
  }

  if (!user.is_verified) {
    return res.render('login', { error: 'Please verify your email before logging in.' });
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

    // check token validity
    if (!user || user.verify_token !== token || new Date(user.verify_token_expiry) < new Date()) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    await userModel.verifyUser(decoded.email);
    // เมื่อยืนยันสำเร็จ อาจจะ redirect ไปหน้า login พร้อมข้อความแจ้ง
    res.redirect('/login?verified=true'); // สามารถนำ query param ไปแสดงผลที่หน้า login ได้
  } catch (err) {
    console.error("Verify Email Error:", err.message);
    res.status(400).send('Invalid or expired verification link.');
  }
};

exports.deleteUser = async (req, res) => {
  // แก้ไข: ดึง user_id จาก cookie ที่ผ่าน middleware checkAuth มาแล้ว
  const userId = req.cookies.user_id; 
  if (!userId) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await userModel.deleteUser(userId);
    // เมื่อลบสำเร็จ ให้ clear cookie และ redirect ไปหน้า register หรือ login
    res.clearCookie('user_id');
    res.redirect('/register');
  } catch (err) {
    console.error("Delete User Error:", err.message);
    // ควรมีหน้าแสดงผล error ที่เป็นมิตรกับผู้ใช้
    res.status(500).send('Error deleting user');
  }
};
