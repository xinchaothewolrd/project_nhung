const User = require('../models/User');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  try {
    const { username, password, role, full_name } = req.body;
    
    // Kiểm tra xem user đã tồn tại chưa
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const user = await User.create({
      username,
      password_hash: password, // Sẽ tự động được hash bởi hooks trong model
      role,
      full_name
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
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
        full_name: user.full_name
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { register, login };
