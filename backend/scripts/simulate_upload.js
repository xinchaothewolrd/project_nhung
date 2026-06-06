const fs = require('fs');
const path = require('path');

async function main() {
  const csvPath = path.join(__dirname, '..', '..', 'ai', 'ecg_data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Không tìm thấy file ecg_data.csv tại:', csvPath);
    return;
  }
  
  const fileBuffer = fs.readFileSync(csvPath);
  const blob = new Blob([fileBuffer], { type: 'text/csv' });
  
  const formData = new FormData();
  formData.append('mac_address', 'ESP32-DEMO-01');
  formData.append('bpm', '78');
  formData.append('spo2', '98');
  formData.append('ecg_file', blob, 'ecg_data.csv');

  console.log('🚀 Đang gửi dữ liệu đo ECG đến http://localhost:5000/api/upload...');
  const res = await fetch('http://localhost:5000/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    console.error('❌ Yêu cầu thất bại:', res.status, res.statusText);
    const errText = await res.text();
    console.error(errText);
    return;
  }

  const data = await res.json();
  console.log('✅ Upload thành công!');
  console.log('Kết quả từ Server:', JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('❌ Lỗi thực thi:', err);
});
