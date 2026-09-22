require("dotenv").config();
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const path = require("path");
require("./config/db"); // Kết nối MongoDB
require("./utils/cronJobs"); // Tự động nhắc hạn

const app = express();

// Cấu hình view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 giờ
  }),
);
app.use(flash());

// Biến global dùng trong mọi view EJS
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success_msg = req.flash("success")[0] || "";
  res.locals.error_msg = req.flash("error")[0] || "";
  res.locals.libraryName = process.env.LIBRARY_NAME || "Thư viện Mini";
  next();
});

// Routes
app.use("/", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/student", require("./routes/student"));

// Trang 404
app.use((req, res) => res.status(404).render("404", {}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server đang chạy tại http://localhost:${PORT}`),
);
