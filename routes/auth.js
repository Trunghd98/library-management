const express = require('express');
const router  = express.Router();
const User    = require('../models/User');

router.get('/', (req, res) => res.redirect('/login'));

router.get('/login', (req, res) => {
  if (req.session.user)
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/student');
  res.render('login', { title: 'Đăng nhập' });
});

router.post('/login', async (req, res) => {
  try {
    const { studentId, password } = req.body;
    const user = await User.findOne({ studentId });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error', 'Mã học sinh hoặc mật khẩu không đúng!');
      return res.redirect('/login');
    }
    req.session.user = {
      _id: user._id, studentId: user.studentId,
      fullName: user.fullName, role: user.role
    };
    res.redirect(user.role === 'admin' ? '/admin' : '/student');
  } catch (err) {
    req.flash('error', 'Có lỗi xảy ra, vui lòng thử lại!');
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});


module.exports = router;
