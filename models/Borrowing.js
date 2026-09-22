const mongoose = require("mongoose");

const borrowingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowDate: { type: Date, default: Date.now },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ["borrowing", "returned", "overdue"],
      default: "borrowing",
    },
    fine: { type: Number, default: 0 },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Borrowing", borrowingSchema);
