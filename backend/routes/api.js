const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadECG, getPatientRecords, doctorConfirm } = require('../controllers/recordController');
const { register, login } = require('../controllers/authController');
const { protect } = require('../utils/authMiddleware');

// Cấu hình lưu trữ tệp CSV
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ecg/');
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

// Routes cho Frontend
router.get('/records/:patient_id', protect, getPatientRecords);
router.post('/doctor/confirm', protect, doctorConfirm);

module.exports = router;
