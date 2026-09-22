require("dotenv").config();
require("./config/db");
const User = require("./models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function test() {
  try {
    const user = await User.findOne({ studentId: "admin" });
    console.log("User found:", user ? "YES" : "NO");
    if (user) {
      console.log("User doc:", user.toObject());
      const match = await bcrypt.compare("123456", user.password);
      console.log("Password match for '123456':", match ? "YES" : "NO");
      
      const match2 = await user.comparePassword("123456");
      console.log("comparePassword method:", match2 ? "YES" : "NO");
    }
    
    // List all users
    const all = await User.find({}, 'studentId');
    console.log("All users in DB:", all.map(u => u.studentId));
    
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    mongoose.connection.close();
  }
}
test();
