const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Controllers
const { uploadECG, getPatientRecords, doctorConfirm } = require('../controllers/recordController');
const { register, login } = require('../controllers/authController');
const adminController = require('../controllers/adminController');
const { protect, adminProtect, onlyAdmin } = require('../utils/authMiddleware');

// Cấu hình lưu trữ tệp CSV
const uploadDir = 'uploads/ecg/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `ecg-${Date.now()}.csv`);
  }
});

const upload = multer({ storage });

// Routes cho ESP32
router.post('/upload', upload.single('ecg_file'), uploadECG);

// Routes Auth
router.post('/auth/register', register);
router.post('/auth/login', login);

// Routes cho Frontend (User Role)
router.get('/records/:patient_id', protect, getPatientRecords);
router.post('/doctor/confirm', protect, doctorConfirm);

// ==========================================
// Routes cho Admin Dashboard (yêu cầu DOCTOR role)
// ==========================================

// Users
router.get('/users', adminProtect, adminController.getUsers);
router.post('/users', adminProtect, onlyAdmin, adminController.createUser);
router.put('/users/:id', adminProtect, onlyAdmin, adminController.updateUser);
router.delete('/users/:id', adminProtect, onlyAdmin, adminController.deleteUser);

// Devices
router.get('/devices', adminProtect, adminController.getDevices);
router.post('/devices', adminProtect, onlyAdmin, adminController.createDevice);
router.delete('/devices/:id', adminProtect, onlyAdmin, adminController.deleteDevice);

// Health Records
router.get('/health-records', adminProtect, adminController.getHealthRecords);
router.put('/health-records/:id', adminProtect, adminController.updateHealthRecord);
router.delete('/health-records/:id', adminProtect, onlyAdmin, adminController.deleteHealthRecord);
router.post('/health-records/analyze/:id', adminProtect, adminController.analyzeHealthRecord);

module.exports = router;

