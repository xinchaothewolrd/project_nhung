require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const apiRoutes = require('./routes/api');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (để Frontend có thể xem file CSV nếu cần)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
