require('dotenv').config();
const sequelize = require('../config/database');
const User = require('../models/User');
const Device = require('../models/Device');
const HealthRecord = require('../models/HealthRecord');

const CSV_FILES = [
  'uploads/ecg/ecg-1780064900737.csv',
  'uploads/ecg/ecg-1780065210916.csv',
  'uploads/ecg/ecg-1780065463772.csv',
  'uploads/ecg/ecg-1780065622875.csv',
  'uploads/ecg/ecg-1780065856637.csv',
  'uploads/ecg/ecg-1780066061708.csv',
  'uploads/ecg/ecg-1780066394059.csv',
  'uploads/ecg/ecg-1780757749554.csv'
];

const DIAGNOSES = [
  { diagnosis: 'Normal', code: 'NORM', text: 'Nhịp tim bình thường.' },
  { diagnosis: 'Bradycardia', code: 'BRAD', text: 'Nhịp tim chậm. Cần theo dõi thêm khi nghỉ ngơi.' },
  { diagnosis: 'Tachycardia', code: 'TACH', text: 'Nhịp tim nhanh. Hãy hạn chế hoạt động mạnh hoặc sử dụng chất kích thích.' },
  { diagnosis: 'Atrial Fibrillation', code: 'AFIB', text: 'Rung tâm nhĩ. Đây là dấu hiệu rối loạn nhịp tim cần tham vấn bác sĩ sớm.' }
];

const DOCTOR_ADVISES = [
  'Kết quả đo ổn định, hãy tiếp tục duy trì chế độ sinh hoạt và luyện tập điều độ.',
  'Nhịp tim hơi chậm khi nghỉ ngơi, nếu không kèm chóng mặt hay mệt mỏi thì không đáng ngại.',
  'Nhịp tim hơi cao, đề xuất nghỉ ngơi thư giãn 15 phút rồi đo lại. Tránh uống trà, cà phê trước khi đo.',
  'Có hiện tượng rối loạn nhịp nhẹ. Đề nghị hạn chế căng thẳng, đo định kỳ 2 lần/ngày và liên hệ phòng khám nếu thấy khó chịu ở ngực.'
];

async function main() {
  await sequelize.authenticate();
  console.log('✅ Connected to DB');

  // 1. Clean up existing mock accounts if any (prevent duplicates on rerun)
  console.log('🧹 Cleaning up old mock data...');
  const existingMockUsers = await User.findAll({
    where: {
      username: [
        'patient_seed1', 'patient_seed2', 'patient_seed3', 'patient_seed4', 'patient_seed5', 'patient_seed6',
        'doctor_seed1', 'doctor_seed2'
      ]
    }
  });

  for (const u of existingMockUsers) {
    // Clean up records and devices first to avoid foreign key constraint issues
    await HealthRecord.destroy({ where: { patient_id: u.id } });
    await Device.destroy({ where: { patient_id: u.id } });
    await u.destroy();
  }
  console.log('🧹 Cleaned up old mock users.');

  // 2. Create Doctors
  console.log('👥 Creating mock doctors...');
  const doc1 = await User.create({
    username: 'doctor_seed1',
    password_hash: '123456', // will be hashed by User hooks
    role: 'DOCTOR',
    full_name: 'BS. Nguyễn Văn Minh',
    phone: '0981112222'
  });
  const doc2 = await User.create({
    username: 'doctor_seed2',
    password_hash: '123456',
    role: 'DOCTOR',
    full_name: 'BS. Lê Thị Thu',
    phone: '0983334444'
  });
  console.log(`  Created doctors: ${doc1.full_name}, ${doc2.full_name}`);

  // 3. Create Patients
  const patientsData = [
    { username: 'patient_seed1', name: 'Nguyễn Văn An', phone: '0912001001', mac: 'AA:BB:CC:DD:EE:11' },
    { username: 'patient_seed2', name: 'Trần Thị Bình', phone: '0912001002', mac: 'AA:BB:CC:DD:EE:12' },
    { username: 'patient_seed3', name: 'Lê Văn Cường', phone: '0912001003', mac: 'AA:BB:CC:DD:EE:13' },
    { username: 'patient_seed4', name: 'Phạm Thị Dung', phone: '0912001004', mac: 'AA:BB:CC:DD:EE:14' },
    { username: 'patient_seed5', name: 'Hoàng Văn Hải', phone: '0912001005', mac: 'AA:BB:CC:DD:EE:15' },
    { username: 'patient_seed6', name: 'Vũ Thị Hương', phone: '0912001006', mac: 'AA:BB:CC:DD:EE:16' }
  ];

  console.log('👥 Creating mock patients, devices, and health records...');
  for (const p of patientsData) {
    const user = await User.create({
      username: p.username,
      password_hash: '123456',
      role: 'PATIENT',
      full_name: p.name,
      phone: p.phone
    });

    // Create Device mapping
    await Device.create({
      mac_address: p.mac,
      patient_id: user.id
    });

    // Create 4 records per patient spread over the last 5 days
    for (let i = 0; i < 4; i++) {
      const daysAgo = 4 - i;
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(8 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));

      // Random metrics
      const bpm = 60 + Math.floor(Math.random() * 50); // 60 - 110
      const spo2 = 94 + Math.floor(Math.random() * 6); // 94 - 99
      const csvFile = CSV_FILES[Math.floor(Math.random() * CSV_FILES.length)];

      // Pick diagnosis based on bpm
      let diagInfo = DIAGNOSES[0]; // Normal
      if (bpm < 65) {
        diagInfo = DIAGNOSES[1]; // Bradycardia
      } else if (bpm > 100) {
        diagInfo = DIAGNOSES[2]; // Tachycardia
      } else if (Math.random() < 0.15) {
        diagInfo = DIAGNOSES[3]; // AFib (random occurrence)
      }

      const doctorConfirmed = Math.random() < 0.7; // 70% chance doctor has confirmed
      const advise = doctorConfirmed ? DOCTOR_ADVISES[Math.floor(Math.random() * DOCTOR_ADVISES.length)] : null;

      await HealthRecord.create({
        patient_id: user.id,
        bpm,
        spo2,
        ecg_file_url: csvFile,
        ai_diagnosis: JSON.stringify({
          diagnosis: diagInfo.diagnosis,
          confidence: parseFloat((0.85 + Math.random() * 0.14).toFixed(2))
        }),
        ai_diagnosis_code: diagInfo.code,
        doctor_confirm: doctorConfirmed,
        doctor_advise: advise,
        createdAt: date,
        updatedAt: date
      });
    }

    console.log(`  Added patient '${p.name}' (MAC: ${p.mac}) with 4 health records.`);
  }

  console.log('🎉 Seeding successfully completed!');
  await sequelize.close();
}

main().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
