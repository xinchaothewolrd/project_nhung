const { Sequelize } = require('sequelize');
const path = require('path');
// Nạp .env ngay lập tức tại đây để chắc chắn
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
  }
);

module.exports = sequelize;
