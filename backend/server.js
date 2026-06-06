require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();

// Cấu hình CORS — chỉ cho phép các origin frontend hợp lệ
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có origin (e.g. Postman, ESP32, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (để Frontend có thể xem file CSV nếu cần)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Phục vụ Admin Dashboard tĩnh tại /admin
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend')));

// Routes
app.use('/api', apiRoutes);

// Database Sync & Start Server
const PORT = process.env.PORT || 5000;

sequelize.sync({ force: false }) // Đổi thành true nếu muốn xóa hết bảng và tạo lại
  .then(() => {
    console.log('Database connected & synced');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
