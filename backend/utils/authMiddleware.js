const jwt = require('jsonwebtoken');
require('dotenv').config();

const protect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Middleware dành cho Admin Dashboard — cho phép cả DOCTOR và ADMIN truy cập
const adminProtect = (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_123');
      if (decoded.role !== 'DOCTOR' && decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Access denied: Doctor or Admin role required' });
      }
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

// Middleware chỉ dành riêng cho ADMIN (như CRUD users/devices/delete records)
const onlyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
};

module.exports = { protect, adminProtect, onlyAdmin };
