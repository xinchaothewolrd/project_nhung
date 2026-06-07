const User = require('../models/User');
const Device = require('../models/Device');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { username, password, role, full_name, phone, mac_address } = req.body;
    
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
    }

    const user = await User.create({
      username,
      password_hash: password, // Sẽ tự động được hash bởi hooks trong model
      role: role || 'PATIENT',
      full_name,
      phone: phone || null,
    });

    // Nếu có mã MAC thiết bị, tự động liên kết thiết bị với tài khoản mới
    if (mac_address) {
      const normalizedMac = mac_address.toUpperCase();
      const existingDevice = await Device.findOne({ where: { mac_address: normalizedMac } });
      if (existingDevice) {
        // Thiết bị đã tồn tại → cập nhật patient_id
        existingDevice.patient_id = user.id;
        await existingDevice.save();
      } else {
        // Tạo mới thiết bị
        await Device.create({ mac_address: normalizedMac, patient_id: user.id });
      }
    }

    res.status(201).json({ message: 'Đăng ký thành công', userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ where: { username } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Tạo token JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret_key_123',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
