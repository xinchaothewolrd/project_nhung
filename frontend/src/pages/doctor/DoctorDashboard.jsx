import { useState, useEffect, useCallback } from 'react'
import { adminApi, showToast, fmtDate } from '../admin/adminUtils'

// Dashboard bác sĩ: xem tổng quan bệnh nhân + hồ sơ cần xác nhận
export default function DoctorDashboard() {
  const [patients, setPatients] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [users, recs] = await Promise.all([adminApi('/users'), adminApi('/health-records')])
      setPatients(users.filter(u => u.role === 'PATIENT'))
      setRecords(recs)
    } catch (e) { showToast('Lỗi tải dữ liệu: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const pending = records.filter(r => !r.doctor_confirm)
  const recent = [...records].reverse().slice(0, 5)

  if (loading) return <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>

  return (
    <div className="adm-page">
      {/* Stats */}
      <div className="adm-stat-grid">
        <StatCard color="blue" icon="👥" label="Tổng bệnh nhân" value={patients.length} sub="Đang theo dõi" />
        <StatCard color="yellow" icon="📋" label="Tổng hồ sơ" value={records.length} sub="Lần đo đã ghi" />
        <StatCard color="red" icon="⏳" label="Chờ xác nhận" value={pending.length} sub="Cần bác sĩ xem" />
        <StatCard color="green" icon="✅" label="Đã xác nhận" value={records.length - pending.length} sub="Hồ sơ hoàn tất" />
      </div>

      <div className="adm-grid-2">
        {/* Pending Records */}
        <div className="adm-card">
          <div className="adm-card-head"><h3>⏳ Hồ sơ chờ xác nhận</h3></div>
          {pending.length ? (
            <table className="adm-table">
              <thead><tr><th>Bệnh nhân</th><th>BPM</th><th>SpO₂</th><th>Thời gian</th></tr></thead>
              <tbody>
                {pending.slice(0, 6).map(r => (
                  <tr key={r.id}>
                    <td><b>{r.User?.full_name || r.patient_id}</b></td>
                    <td><b style={{ color: r.bpm > 100 || r.bpm < 60 ? '#f87171' : '#34d399' }}>{r.bpm ?? '—'}</b></td>
                    <td>{r.spo2 ?? '—'}%</td>
                    <td style={{ fontSize: 12, color: 'var(--adm-muted)' }}>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="adm-empty" style={{ padding: '24px 0' }}>✅ Tất cả đã xác nhận</div>}
        </div>

        {/* Patient List */}
        <div className="adm-card">
          <div className="adm-card-head"><h3>👤 Danh sách bệnh nhân</h3></div>
          {patients.length ? (
            <table className="adm-table">
              <thead><tr><th>Họ tên</th><th>Username</th><th>SĐT</th></tr></thead>
              <tbody>
                {patients.map(u => (
                  <tr key={u.id}>
                    <td><b>{u.full_name || '—'}</b></td>
                    <td><code style={{ color: '#93c5fd' }}>{u.username}</code></td>
                    <td className="adm-muted">{u.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="adm-empty">Chưa có bệnh nhân</div>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ color, icon, label, value, sub }) {
  return (
    <div className={`adm-stat-card ${color}`}>
      <div className="adm-stat-icon">{icon}</div>
      <div className="adm-stat-label">{label}</div>
      <div className="adm-stat-value">{value}</div>
      <div className="adm-stat-sub">{sub}</div>
    </div>
  )
}
