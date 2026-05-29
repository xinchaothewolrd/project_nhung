const HealthRecord = require('../models/HealthRecord');
const Device = require('../models/Device');
const User = require('../models/User');
const { runInference } = require('../utils/aiBridge');
const path = require('path');

const uploadECG = async (req, res) => {
  try {
    const { mac_address, bpm, spo2 } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No ECG file uploaded' });
    }

    // 1. Tìm bệnh nhân dựa trên MAC address
    let device = await Device.findOne({ where: { mac_address } });
    if (!device) {
      // Tìm bệnh nhân đầu tiên để tự động đăng ký thiết bị (tiện lợi cho việc demo và test)
      let firstPatient = await User.findOne({ where: { role: 'PATIENT' } });
      if (!firstPatient) {
        // Tự động tạo một bệnh nhân mặc định nếu hệ thống chưa có bệnh nhân nào!
        firstPatient = await User.create({
          username: 'demo_patient',
          password_hash: '123456', // Sẽ được tự động mã hóa bởi hook beforeCreate trong User.js
          role: 'PATIENT',
          full_name: 'Bệnh Nhân Mặc Định'
        });
        console.log('Automatically created a default patient in system');
      }
      
      device = await Device.create({
        mac_address,
        patient_id: firstPatient.id
      });
      console.log(`Automatically registered device ${mac_address} to patient ID ${firstPatient.id}`);
    }

    const patient_id = device.patient_id;
    const ecg_file_url = `/uploads/ecg/${file.filename}`;

    // 2. Lưu bản ghi tạm thời
    const record = await HealthRecord.create({
      patient_id,
      bpm,
      spo2,
      ecg_file_url,
      ai_diagnosis: 'Processing...'
    });

    // 3. Gọi AI Inference (chạy ngầm hoặc đợi tùy nhu cầu)
    // Ở đây ta đợi để trả về kết quả ngay cho ESP32 nếu cần
    try {
      const aiResult = await runInference(file.path);
      
      if (aiResult.error) {
        throw new Error(aiResult.error);
      }
      
      // 4. Cập nhật kết quả AI
      record.ai_diagnosis = aiResult.diagnosis;
      record.ai_diagnosis_code = aiResult.diagnosis_code;
      await record.save();

      res.status(200).json({
        message: 'Upload successful',
        record_id: record.id,
        diagnosis: aiResult.diagnosis,
        diagnosis_code: aiResult.diagnosis_code,
        is_abnormal: aiResult.is_abnormal,
        distribution: aiResult.distribution
      });
    } catch (aiError) {
      console.error('AI Inference Error:', aiError);
      record.ai_diagnosis = 'AI Error';
      await record.save();
      res.status(200).json({
        message: 'Upload successful, but AI failed',
        record_id: record.id,
        diagnosis: 'AI Error'
      });
    }

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPatientRecords = async (req, res) => {
  try {
    const { patient_id } = req.params;
    const records = await HealthRecord.findAll({
      where: { patient_id },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const doctorConfirm = async (req, res) => {
  try {
    const { record_id, confirm, advise } = req.body;
    const record = await HealthRecord.findByPk(record_id);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    record.doctor_confirm = confirm;
    record.doctor_advise = advise;
    await record.save();

    res.status(200).json({ message: 'Record updated by doctor' });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  uploadECG,
  getPatientRecords,
  doctorConfirm
};
