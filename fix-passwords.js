require("dotenv").config();
require("./config/db");
const User = require("./models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function fix() {
  try {
    const hash = await bcrypt.hash("123456", 10);
    const result = await User.updateMany({}, { $set: { password: hash } });
    console.log("Fixed passwords for users:", result.modifiedCount);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
}
fix();
