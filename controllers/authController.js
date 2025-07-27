const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');

exports.renderLogin = (req, res) => {
  res.render('login');
};

exports.renderRegister = (req, res) => {
  res.render('register');
};

exports.register = async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (!username || !email || !password || !confirmPassword) {
    return res.send('All fields are required');
  }

  if (password !== confirmPassword) {
    return res.send('Passwords do not match');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await userModel.createUser({ username, email, hashedPassword });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.send('User already exists or database error');
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;
  const user = await userModel.findByUsernameOrEmail(login);
  if (!user) return res.send('Invalid credentials');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return res.send('Invalid credentials');

  res.cookie('user_id', user.user_id, { httpOnly: true });
  res.redirect('/');
};

exports.logout = (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
};

exports.renderHome = async (req, res) => {
  const user = await userModel.findById(req.cookies.user_id);
  if (!user) return res.redirect('/login');
  res.render('index', { username: user.username });
};

exports.renderAbout = (req, res)=>{
    res.render('about');
}