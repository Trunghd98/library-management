const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Sách giáo khoa", "Sách tham khảo", "Truyện", "Bách khoa", "Khác"],
    },
    publisher: { type: String, trim: true },
    totalCopies: { type: Number, required: true, min: 1 },
    availableCopies: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Book", bookSchema);
