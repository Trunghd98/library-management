const express      = require('express');
const router       = express.Router();
const { isStudent }= require('../middlewares/auth');
const Book         = require('../models/Book');
const Borrowing    = require('../models/Borrowing');
const Notification = require('../models/Notification');
const User         = require('../models/User');

router.use(isStudent);

router.get('/', async (req, res) => {
  const userId = req.session.user._id;
  const [activeBorrowings, unreadCount] = await Promise.all([
    Borrowing.find({ userId, status: { $in: ['borrowing','overdue'] } }).populate('bookId'),
    Notification.countDocuments({ userId, isRead: false })
  ]);
  res.render('student/dashboard', { title: 'Trang chủ', activeBorrowings, unreadCount });
});

router.get('/books', async (req, res) => {
  const { search, category } = req.query;
  let query = {};
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { author: { $regex: search, $options: 'i' } }
  ];
  if (category) query.category = category;
  const books = await Book.find(query).sort({ title: 1 });
  res.render('student/books', { title: 'Tra cứu sách', books, search: search || '', category: category || '' });
});

router.get('/my-borrowings', async (req, res) => {
  const { status } = req.query;
  const borrowings = await Borrowing.find({ userId: req.session.user._id })
    .populate('bookId', 'title author category').sort({ createdAt: -1 });
  res.render('student/my-borrowings', { title: 'Lịch sử mượn sách', borrowings, status: status || '' });
});

router.get('/notifications', async (req, res) => {
  const userId = req.session.user._id;
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  res.render('student/notifications', { title: 'Thông báo', notifications });
});

router.get('/profile', (req, res) => {
  res.render('student/profile', { title: 'Thông tin cá nhân' });
});

router.post('/profile/info', async (req, res) => {
  try {
    const { class: studentClass } = req.body;
    await User.findByIdAndUpdate(req.session.user._id, { class: studentClass });
    req.session.user.class = studentClass; // update session
    req.flash('success', 'Cập nhật thông tin lớp học thành công!');
    res.redirect('/student/profile');
  } catch (err) {
    req.flash('error', 'Có lỗi xảy ra khi cập nhật thông tin.');
    res.redirect('/student/profile');
  }
});

router.post('/profile/password', async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      req.flash('error', 'Mật khẩu xác nhận không khớp!');
      return res.redirect('/student/profile');
    }
    const user = await User.findById(req.session.user._id);
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      req.flash('error', 'Mật khẩu hiện tại không đúng!');
      return res.redirect('/student/profile');
    }
    user.password = newPassword;
    await user.save(); // trigger pre-save hook for bcrypt
    req.flash('success', 'Đổi mật khẩu thành công!');
    res.redirect('/student/profile');
  } catch (err) {
    req.flash('error', 'Có lỗi xảy ra khi đổi mật khẩu.');
    res.redirect('/student/profile');
  }
});

module.exports = router;
