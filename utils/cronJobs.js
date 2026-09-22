const cron         = require('node-cron');
const Borrowing    = require('../models/Borrowing');
const Notification = require('../models/Notification');

cron.schedule('0 7 * * *', async () => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

    // Sách sẽ đến hạn ngày mai
    const soonDue = await Borrowing.find({
      status: 'borrowing', dueDate: { $gte: tomorrow, $lt: dayAfter }
    }).populate('bookId');
    for (const b of soonDue) {
      await Notification.create({
        userId: b.userId, type: 'reminder',
        message: `⏰ Sách "${b.bookId.title}" sẽ đến hạn trả vào NGÀY MAI! Hạn trả: ${new Date(b.dueDate).toLocaleDateString('vi-VN')}`
      });
    }

    // Sách đã quá hạn
    const overdue = await Borrowing.find({ status: { $in: ['borrowing','overdue'] }, dueDate: { $lt: today } })
      .populate('bookId');
    for (const b of overdue) {
      const days = Math.floor((today - new Date(b.dueDate)) / (1000*60*60*24));
      const fine = days * parseInt(process.env.FINE_PER_DAY || 50000);
      await Borrowing.findByIdAndUpdate(b._id, { status: 'overdue', fine });
      await Notification.create({
        userId: b.userId, type: 'overdue',
        message: `⚠️ Sách "${b.bookId.title}" quá hạn ${days} ngày. Tiền phạt: ${fine.toLocaleString('vi-VN')}đ`
      });
    }
    console.log('✅ Cron: Kiểm tra hạn sách lúc 7h sáng xong!');
  } catch (err) { console.error('Cron error:', err); }
});
