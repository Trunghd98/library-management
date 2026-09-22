exports.isLoggedIn = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error', 'Vui lòng đăng nhập để tiếp tục');
  res.redirect('/login');
};

exports.isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Bạn không có quyền truy cập trang này');
  res.redirect('/login');
};

exports.isStudent = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'student') return next();
  res.redirect('/login');
};
