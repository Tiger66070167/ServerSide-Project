// middleware/authMiddleware.js
exports.checkAuth = (req, res, next) => {
  if (!req.cookies.user_id) return res.redirect('/login');
  next();
};

exports.setNoCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
};
