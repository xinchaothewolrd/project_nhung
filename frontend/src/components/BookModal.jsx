// Modal đặt lịch khám (placeholder vì backend chưa có API đặt lịch)
export default function BookModal({ open, onClose }) {
  if (!open) return null
  return (
    <div className="modal-bg on" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <h3>Đặt lịch khám tim mạch</h3>
        <p>
          Tính năng đặt lịch sẽ kết nối bạn với phòng khám/bác sĩ phụ trách. Trong lúc chờ,
          bạn có thể mang theo báo cáo ECG này khi đi khám hoặc gọi tổng đài đặt khám của bệnh viện.
        </p>
        <button className="btn m-close" onClick={onClose}>Đã hiểu</button>
      </div>
    </div>
  )
}
