const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Device = sequelize.define('Device', {
  mac_address: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false
  },
  patient_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});

module.exports = Device;
