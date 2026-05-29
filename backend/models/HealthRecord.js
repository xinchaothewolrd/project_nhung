const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const HealthRecord = sequelize.define('HealthRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patient_id: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  bpm: {
    type: DataTypes.INTEGER
  },
  spo2: {
    type: DataTypes.INTEGER
  },
  ecg_file_url: {
    type: DataTypes.STRING
  },
  ai_diagnosis: {
    type: DataTypes.STRING,
    defaultValue: 'Pending'
  },
  ai_diagnosis_code: {
    type: DataTypes.STRING(5),
    defaultValue: null
  },
  doctor_confirm: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  doctor_advise: {
    type: DataTypes.TEXT
  }
});

module.exports = HealthRecord;
