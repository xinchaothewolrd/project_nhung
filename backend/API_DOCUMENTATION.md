# Tài liệu API - Hệ thống Giám sát Sức khỏe Thông minh

Tài liệu này dành cho nhóm phát triển Frontend để kết nối với Backend.

**Base URL:** `http://localhost:5000/api`

---

## 1. Xác thực người dùng (Auth)

### Đăng ký tài khoản
- **URL:** `/auth/register`
- **Method:** `POST`
- **Body:**
    - `username` (String): Tên đăng nhập.
    - `password` (String): Mật khẩu.
    - `role` (String): 'PATIENT' hoặc 'DOCTOR'.
    - `full_name` (String): Họ tên.

### Đăng nhập
- **URL:** `/auth/login`
- **Method:** `POST`
- **Body:**
    - `username` (String): Tên đăng nhập.
    - `password` (String): Mật khẩu.

- **Response (Thành công):** Trả về `token` dùng cho các yêu cầu sau này.

---

## 2. Upload dữ liệu từ ESP32
Dùng để gửi dữ liệu nhịp tim, oxy trong máu và tệp ECG thô.

- **URL:** `/upload`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body:**
    - `mac_address` (String): Địa chỉ MAC của thiết bị.
    - `bpm` (Number): Nhịp tim.
    - `spo2` (Number): Nồng độ Oxy.
    - `ecg_file` (File): Tệp CSV chứa dữ liệu sóng ECG (18,000 điểm).

- **Response (Thành công):**
```json
{
  "message": "Upload successful",
  "record_id": 1,
  "diagnosis": "Binh thuong (Normal)"
}
```

---

## 2. Lấy lịch sử bệnh án của bệnh nhân
Dùng cho Patient App và Doctor Dashboard.

- **URL:** `/records/:patient_id`
- **Method:** `GET`
- **Params:** `patient_id` (ID của bệnh nhân trong DB).

- **Response:**
```json
[
  {
    "id": 1,
    "patient_id": 5,
    "bpm": 75,
    "spo2": 98,
    "ecg_file_url": "/uploads/ecg/ecg-123456.csv",
    "ai_diagnosis": "Normal",
    "doctor_confirm": false,
    "doctor_advise": null,
    "createdAt": "2026-05-05T..."
  }
]
```

---

## 3. Bác sĩ xác nhận và tư vấn
Dùng cho Doctor Dashboard.

- **URL:** `/doctor/confirm`
- **Method:** `POST`
- **Body:**
    - `record_id` (Number): ID của bản ghi cần cập nhật.
    - `confirm` (Boolean): Bác sĩ xác nhận kết quả AI đúng hay sai.
    - `advise` (String): Lời khuyên của bác sĩ.

- **Response:**
```json
{
  "message": "Record updated by doctor"
}
```

---

## Lưu ý cho Frontend:
- Tệp ECG được lưu dưới dạng URL (`ecg_file_url`). Các bạn có thể tải về hoặc đọc trực tiếp để vẽ biểu đồ bằng thư viện như `ECharts` hoặc `Plotly.js`.
- Cần tạo dữ liệu mẫu trong bảng `Devices` (MAC address -> Patient ID) trước khi test upload từ ESP32.
