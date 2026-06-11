import { useState, useEffect } from 'react'
import { adminApi, showToast, fmtDate } from './adminUtils'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, devices: 0, records: 0, pending: 0 })
  const [recentRecords, setRecentRecords] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [users, devices, records] = await Promise.all([
        adminApi('/users'), adminApi('/devices'), adminApi('/health-records')
      ])
      const pending = records.filter(r => {
        if (r.doctor_confirm) return false
        try { const ai = JSON.parse(r.ai_diagnosis); return ai.diagnosis !== 'NORMAL' } catch { return true }
      })
      setStats({ users: users.length, devices: devices.length, records: records.length, pending: pending.length, allDevices: devices })
      setRecentRecords([...records].reverse().slice(0, 5))
      setPatients(users.filter(u => u.role === 'PATIENT').slice(0, 6))
    } catch (e) { showToast('Lỗi tải dashboard: ' + e.message, 'err') }
    finally { setLoading(false) }
  }

  if (loading) return <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>

  return (
    <div className="adm-page">
      {/* Stats */}
      <div className="adm-stat-grid">
        <StatCard color="blue" icon="👥" label="Tổng người dùng" value={stats.users} sub="Bệnh nhân & bác sĩ" />
        <StatCard color="green" icon="📡" label="Thiết bị đăng ký" value={stats.devices} sub="ESP32 & các thiết bị" />
        <StatCard color="yellow" icon="📋" label="Hồ sơ sức khỏe" value={stats.records} sub="Tổng lần đo" />
        <StatCard color="red" icon="⏳" label="Chờ xác nhận" value={stats.pending} sub="Bác sĩ cần xem" />
      </div>

      <div className="adm-grid-2">
        {/* Recent Records */}
        <div className="adm-card">
          <div className="adm-card-head"><h3>🩺 Hồ sơ gần đây</h3></div>
          {recentRecords.length ? (
            <table className="adm-table">
              <thead><tr><th>BN</th><th>BPM</th><th>SpO₂</th><th>Thời gian</th></tr></thead>
              <tbody>
                {recentRecords.map(r => (
                  <tr key={r.id}>
                    <td><b>{r.User?.full_name || r.patient_id}</b></td>
                    <td><b style={{ color: r.bpm > 100 || r.bpm < 60 ? '#f87171' : '#34d399' }}>{r.bpm ?? '—'}</b></td>
                    <td>{r.spo2 ?? '—'}%</td>
                    <td style={{ fontSize: 12, color: 'var(--adm-muted)' }}>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="adm-empty">📋 Chưa có hồ sơ</div>}
        </div>

        {/* Patients */}
        <div className="adm-card">
          <div className="adm-card-head"><h3>👤 Bệnh nhân</h3></div>
          {patients.length ? (
            <table className="adm-table">
              <thead><tr><th>Họ tên</th><th>SĐT</th><th>Thiết bị</th></tr></thead>
              <tbody>
                {patients.map(u => {
                  const devCount = stats.allDevices?.filter(d => d.patient_id === u.id).length || 0;
                  return (
                    <tr key={u.id}>
                      <td><b>{u.full_name || u.username}</b></td>
                      <td style={{ color: 'var(--adm-muted)' }}>{u.phone || '—'}</td>
                      <td><span className="adm-badge green">{devCount} thiết bị</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : <div className="adm-empty">👤 Chưa có bệnh nhân</div>}
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
