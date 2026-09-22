const express      = require('express');
const router       = express.Router();
const { isAdmin }  = require('../middlewares/auth');
const Book         = require('../models/Book');
const User         = require('../models/User');
const Borrowing    = require('../models/Borrowing');
const Notification = require('../models/Notification');

router.use(isAdmin);

// ── DASHBOARD ──────────────────────────────────────────
router.get('/', async (req, res) => {
  const [totalBooks, totalStudents, activeBorrowings, overdueBorrowings, recentBorrowings] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Borrowing.countDocuments({ status: 'borrowing' }),
    Borrowing.countDocuments({ status: 'overdue' }),
    Borrowing.find()
      .populate('userId', 'fullName studentId class')
      .populate('bookId', 'title')
      .sort({ createdAt: -1 }).limit(5)
  ]);
  res.render('admin/dashboard', {
    title: 'Dashboard', totalBooks, totalStudents, activeBorrowings, overdueBorrowings, recentBorrowings
  });
});


// ── SÁCH ───────────────────────────────────────────────
router.get('/books', async (req, res) => {
  const { search, category } = req.query;
  let query = {};
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { author: { $regex: search, $options: 'i' } }
  ];
  if (category) query.category = category;
  const books = await Book.find(query).sort({ createdAt: -1 });
  res.render('admin/books', { title: 'Quản lý sách', books, search: search || '', category: category || '' });
});

router.get('/books/add', (req, res) => {
  res.render('admin/book-form', { title: 'Thêm sách mới', book: null });
});

router.post('/books/add', async (req, res) => {
  const { title, author, category, publisher, totalCopies } = req.body;
  await Book.create({ title, author, category, publisher,
    totalCopies: parseInt(totalCopies), availableCopies: parseInt(totalCopies) });
  req.flash('success', `Đã thêm sách "${title}" thành công!`);
  res.redirect('/admin/books');
});

router.get('/books/:id/edit', async (req, res) => {
  const book = await Book.findById(req.params.id);
  res.render('admin/book-form', { title: 'Sửa thông tin sách', book });
});

router.put('/books/:id', async (req, res) => {
  const { title, author, category, publisher, totalCopies } = req.body;
  const book = await Book.findById(req.params.id);
  const diff = parseInt(totalCopies) - book.totalCopies;
  await Book.findByIdAndUpdate(req.params.id, {
    title, author, category, publisher,
    totalCopies: parseInt(totalCopies),
    availableCopies: Math.max(0, book.availableCopies + diff)
  });
  req.flash('success', 'Đã cập nhật thông tin sách!');
  res.redirect('/admin/books');
});

router.delete('/books/:id', async (req, res) => {
  const inUse = await Borrowing.findOne({ bookId: req.params.id, status: { $in: ['borrowing','overdue'] } });
  if (inUse) { req.flash('error', 'Không thể xóa sách đang được mượn!'); return res.redirect('/admin/books'); }
  await Book.findByIdAndDelete(req.params.id);
  req.flash('success', 'Đã xóa sách thành công!');
  res.redirect('/admin/books');
});

// ── HỌC SINH ───────────────────────────────────────────
router.get('/students', async (req, res) => {
  const { search } = req.query;
  let query = { role: 'student' };
  if (search) query.$or = [
    { fullName: { $regex: search, $options: 'i' } },
    { studentId: { $regex: search, $options: 'i' } }
  ];
  const students = await User.find(query).sort({ studentId: 1 });
  res.render('admin/students', { title: 'Quản lý học sinh', students, search: search || '' });
});

router.get('/students/add', (req, res) => {
  res.render('admin/student-form', { title: 'Thêm học sinh', student: null });
});

router.post('/students/add', async (req, res) => {
  const { studentId, fullName, studentClass, password } = req.body;
  if (await User.findOne({ studentId })) {
    req.flash('error', `Mã học sinh "${studentId}" đã tồn tại!`);
    return res.redirect('/admin/students/add');
  }
  await User.create({ studentId, fullName, class: studentClass, password, role: 'student' });
  req.flash('success', `Đã thêm học sinh "${fullName}" thành công!`);
  res.redirect('/admin/students');
});

router.get('/students/:id/edit', async (req, res) => {
  const student = await User.findById(req.params.id);
  res.render('admin/student-form', { title: 'Sửa thông tin học sinh', student });
});

router.put('/students/:id', async (req, res) => {
  const { fullName, studentClass, password } = req.body;
  const updateData = { fullName, class: studentClass };
  if (password && password.trim()) {
    const bcrypt = require('bcryptjs');
    updateData.password = await bcrypt.hash(password.trim(), 10);
  }
  await User.findByIdAndUpdate(req.params.id, updateData);
  req.flash('success', 'Đã cập nhật thông tin học sinh!');
  res.redirect('/admin/students');
});


router.delete('/students/:id', async (req, res) => {
  const inUse = await Borrowing.findOne({ userId: req.params.id, status: { $in: ['borrowing','overdue'] } });
  if (inUse) { req.flash('error', 'Học sinh đang có sách chưa trả, không thể xóa!'); return res.redirect('/admin/students'); }
  await User.findByIdAndDelete(req.params.id);
  req.flash('success', 'Đã xóa học sinh thành công!');
  res.redirect('/admin/students');
});

router.post('/students/:id/reset-password', async (req, res) => {
  const student = await User.findById(req.params.id);
  student.password = '123456';
  await student.save();
  req.flash('success', `Đã reset mật khẩu về "123456" cho ${student.fullName}!`);
  res.redirect('/admin/students');
});

// ── MƯỢN SÁCH ──────────────────────────────────────────
router.get('/borrow', async (req, res) => {
  const [students, availableBooks] = await Promise.all([
    User.find({ role: 'student' }).sort({ fullName: 1 }),
    Book.find({ availableCopies: { $gt: 0 } }).sort({ title: 1 })
  ]);
  res.render('admin/borrow', { title: 'Tạo phiếu mượn', students, availableBooks });
});


router.post('/borrow', async (req, res) => {
  const { userId, bookId, notes } = req.body;
  const maxBooks = parseInt(process.env.MAX_BORROW_BOOKS) || 3;
  const borrowDays = parseInt(process.env.BORROW_DAYS) || 7;
  const count = await Borrowing.countDocuments({ userId, status: { $in: ['borrowing','overdue'] } });
  if (count >= maxBooks) {
    req.flash('error', `Học sinh đã mượn tối đa ${maxBooks} cuốn sách!`);
    return res.redirect('/admin/borrow');
  }
  const book = await Book.findById(bookId);
  if (!book || book.availableCopies <= 0) {
    req.flash('error', 'Sách này hiện không còn bản để mượn!');
    return res.redirect('/admin/borrow');
  }
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + borrowDays);
  await Borrowing.create({ userId, bookId, dueDate, notes });
  await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });
  const user = await User.findById(userId);
  await Notification.create({
    userId, type: 'borrow',
    message: `📚 Bạn đã mượn sách "${book.title}". Hạn trả: ${dueDate.toLocaleDateString('vi-VN')}`
  });
  req.flash('success', `Đã tạo phiếu mượn sách "${book.title}" cho ${user.fullName}!`);
  res.redirect('/admin/borrowings');
});

// ── TRẢ SÁCH ───────────────────────────────────────────
router.get('/return', async (req, res) => {
  const { search } = req.query;
  let activeBorrowings = [];
  let foundStudent = null;
  if (search) {
    foundStudent = await User.findOne({
      $or: [{ studentId: search }, { fullName: { $regex: search, $options: 'i' } }]
    });
    if (foundStudent) {
      activeBorrowings = await Borrowing.find({ userId: foundStudent._id, status: { $in: ['borrowing','overdue'] } })
        .populate('bookId', 'title author').populate('userId', 'fullName studentId');
    }
  }
  res.render('admin/return', { title: 'Trả sách', activeBorrowings, foundStudent, search: search || '' });
});


router.post('/return/:id', async (req, res) => {
  const borrowing = await Borrowing.findById(req.params.id).populate('bookId');
  const today   = new Date();
  const dueDate = new Date(borrowing.dueDate);
  let fine = 0;
  if (today > dueDate) {
    const days = Math.floor((today - dueDate) / (1000*60*60*24));
    fine = days * parseInt(process.env.FINE_PER_DAY || 50000);
  }
  await Borrowing.findByIdAndUpdate(req.params.id, { returnDate: today, status: 'returned', fine });
  await Book.findByIdAndUpdate(borrowing.bookId._id, { $inc: { availableCopies: 1 } });
  const msg = fine > 0
    ? `✅ Đã trả sách "${borrowing.bookId.title}". Tiền phạt: ${fine.toLocaleString('vi-VN')}đ`
    : `✅ Đã trả sách "${borrowing.bookId.title}" đúng hạn!`;
  await Notification.create({ userId: borrowing.userId, type: 'return', message: msg });
  req.flash('success', fine > 0 ? `Trả sách thành công! Tiền phạt: ${fine.toLocaleString('vi-VN')}đ` : 'Trả sách đúng hạn!');
  res.redirect('/admin/return');
});

// ── DANH SÁCH MƯỢN ─────────────────────────────────────
router.get('/borrowings', async (req, res) => {
  const { status } = req.query;
  let query = {};
  if (status) query.status = status;
  const borrowings = await Borrowing.find(query)
    .populate('userId', 'fullName studentId class')
    .populate('bookId', 'title author')
    .sort({ createdAt: -1 });
  res.render('admin/borrowings', { title: 'Danh sách mượn sách', borrowings, status: status || '' });
});

// ── BÁO CÁO ────────────────────────────────────────────
router.get('/reports', async (req, res) => {
  const [totalBooks, totalStudents, borrowingCount, overdueCount, returnedCount, fineResult, topBooksRaw] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ role: 'student' }),
    Borrowing.countDocuments({ status: 'borrowing' }),
    Borrowing.countDocuments({ status: 'overdue' }),
    Borrowing.countDocuments({ status: 'returned' }),
    Borrowing.aggregate([{ $match: { fine: { $gt: 0 } } }, { $group: { _id: null, total: { $sum: '$fine' } } }]),
    Borrowing.aggregate([
      { $group: { _id: '$bookId', borrowCount: { $sum: 1 } } },
      { $sort: { borrowCount: -1 } }, { $limit: 5 },
      { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
      { $unwind: '$book' }
    ])
  ]);
  const totalFine = fineResult.length > 0 ? fineResult[0].total : 0;
  // Flatten topBooks for EJS
  const topBooks = topBooksRaw.map(b => ({
    title: b.book.title, author: b.book.author, borrowCount: b.borrowCount
  }));
  const stats = { totalBooks, totalStudents, returnedCount, totalFine };
  const borrowingStats = { borrowing: borrowingCount, overdue: overdueCount, returned: returnedCount };
  res.render('admin/reports', { title: 'Báo cáo thống kê', stats, borrowingStats, topBooks });
});


module.exports = router;
