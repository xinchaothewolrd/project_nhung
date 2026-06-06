const User = require('../models/User');
const Device = require('../models/Device');
const HealthRecord = require('../models/HealthRecord');
const { runInference } = require('../utils/aiBridge');
const path = require('path');

// Thiết lập quan hệ (Associations)
if (!Device.associations.User) {
  Device.belongsTo(User, { foreignKey: 'patient_id' });
}
if (!HealthRecord.associations.User) {
  HealthRecord.belongsTo(User, { foreignKey: 'patient_id' });
}

// ================= USERS =================

const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password_hash'] },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, password, role, full_name, phone } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username và password là bắt buộc' });
    }
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    const user = await User.create({
      username,
      password_hash: password, // hooks in User model will hash this
      role: role || 'PATIENT',
      full_name: full_name || null,
      phone: phone || null,
    });
    const { password_hash: _, ...safeUser } = user.toJSON();
    res.status(201).json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role, full_name, phone } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (username) user.username = username;
    if (password) user.password_hash = password;
    if (role) user.role = role;
    if (full_name !== undefined) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;

    await user.save();
    const { password_hash: _, ...safeUser } = user.toJSON();
    res.status(200).json(safeUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await user.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= DEVICES =================

const getDevices = async (req, res) => {
  try {
    const devices = await Device.findAll({
      include: [{ model: User, attributes: ['full_name', 'username'] }],
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createDevice = async (req, res) => {
  try {
    const { mac_address, patient_id } = req.body;
    const device = await Device.create({ mac_address, patient_id });
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params; // Trong trường hợp này id chính là mac_address
    const dev = await Device.findByPk(id);
    if (!dev) {
        return res.status(404).json({ error: 'Device not found' });
    }
    await dev.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================= HEALTH RECORDS =================

const getHealthRecords = async (req, res) => {
  try {
    const records = await HealthRecord.findAll({
      include: [
        { model: User, attributes: ['full_name', 'username'] },
      ],
      order: [['createdAt', 'DESC']]
    });

    // Lấy thông tin thiết bị của từng bệnh nhân gán vào hồ sơ
    const results = [];
    for (const record of records) {
      const recData = record.toJSON();
      const device = await Device.findOne({ where: { patient_id: recData.patient_id }});
      if (device) {
        recData.Device = device;
      }
      results.push(recData);
    }

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { doctor_confirm, doctor_advise } = req.body;
    const record = await HealthRecord.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    if (doctor_confirm !== undefined) record.doctor_confirm = doctor_confirm;
    if (doctor_advise !== undefined) record.doctor_advise = doctor_advise;
    
    await record.save();
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await HealthRecord.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    await record.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const analyzeHealthRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await HealthRecord.findByPk(id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    if (!record.ecg_file_url) {
      return res.status(400).json({ error: 'No ECG file to analyze' });
    }

    // file path
    const filePath = path.join(__dirname, '..', record.ecg_file_url);

    const aiResult = await runInference(filePath);
    
    if (aiResult.error) {
      record.ai_diagnosis = 'AI Error';
      await record.save();
      return res.status(500).json({ error: aiResult.error });
    }
    
    record.ai_diagnosis = JSON.stringify({
        diagnosis: aiResult.diagnosis,
        confidence: aiResult.confidence ? aiResult.confidence / 100 : 0.95
    });
    record.ai_diagnosis_code = aiResult.diagnosis_code;
    await record.save();

    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getUsers, createUser, updateUser, deleteUser,
  getDevices, createDevice, deleteDevice,
  getHealthRecords, updateHealthRecord, deleteHealthRecord, analyzeHealthRecord
};
