const express      = require('express');
const router       = express.Router();
const { isStudent }= require('../middlewares/auth');
const Book         = require('../models/Book');
const Borrowing    = require('../models/Borrowing');
const Notification = require('../models/Notification');

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

module.exports = router;
