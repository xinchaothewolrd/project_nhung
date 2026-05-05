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
    const device = await Device.findOne({ where: { mac_address } });
    if (!device) {
      return res.status(404).json({ error: 'Device not registered' });
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
      
      // 4. Cập nhật kết quả AI
      record.ai_diagnosis = aiResult.diagnosis;
      await record.save();

      res.status(200).json({
        message: 'Upload successful',
        record_id: record.id,
        diagnosis: aiResult.diagnosis
      });
    } catch (aiError) {
      console.error('AI Inference Error:', aiError);
      record.ai_diagnosis = 'AI Error';
      await record.save();
      res.status(200).json({ message: 'Upload successful, but AI failed', record_id: record.id });
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
