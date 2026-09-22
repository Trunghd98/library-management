require("dotenv").config();
require("../config/db");
const User = require("../models/User");
const Book = require("../models/Book");
const mongoose = require("mongoose");

async function seed() {
  // Xóa dữ liệu cũ
  await User.deleteMany({});
  await Book.deleteMany({});

  // Tạo tài khoản
  await User.create([
    {
      studentId: "admin",
      fullName: "Thủ Thư",
      role: "admin",
      password: "123456",
    },
    {
      studentId: "HS001",
      fullName: "Nguyễn Văn An",
      class: "10A1",
      password: "123456",
    },
    {
      studentId: "HS002",
      fullName: "Trần Thị Bình",
      class: "10A1",
      password: "123456",
    },
    {
      studentId: "HS003",
      fullName: "Lê Văn Cường",
      class: "11B2",
      password: "123456",
    },
  ]);

  // Tạo sách mẫu
  await Book.create([
    {
      title: "Toán 10",
      author: "Trần Văn Nam",
      category: "Sách giáo khoa",
      publisher: "NXB Giáo Dục",
      totalCopies: 10,
      availableCopies: 10,
    },
    {
      title: "Ngữ Văn 10",
      author: "Nguyễn Thị Lan",
      category: "Sách giáo khoa",
      publisher: "NXB Giáo Dục",
      totalCopies: 8,
      availableCopies: 8,
    },
    {
      title: "Vật Lý 11",
      author: "Lê Minh Tuấn",
      category: "Sách giáo khoa",
      publisher: "NXB Giáo Dục",
      totalCopies: 6,
      availableCopies: 6,
    },
    {
      title: "Lịch Sử Việt Nam",
      author: "Phạm Văn Đức",
      category: "Sách tham khảo",
      publisher: "NXB Hà Nội",
      totalCopies: 5,
      availableCopies: 5,
    },
    {
      title: "Doraemon Tập 1",
      author: "Fujiko F. Fujio",
      category: "Truyện",
      publisher: "NXB Kim Đồng",
      totalCopies: 3,
      availableCopies: 3,
    },
  ]);

  console.log("✅ Đã tạo dữ liệu mẫu thành công!");
  mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  mongoose.connection.close();
});
