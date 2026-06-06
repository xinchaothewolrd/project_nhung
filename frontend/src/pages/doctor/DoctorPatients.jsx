import { useState, useEffect, useCallback } from 'react'
import { adminApi, showToast, fmtDate } from '../admin/adminUtils'

// Danh sách bệnh nhân (chỉ xem, không sửa/xóa)
export default function DoctorPatients() {
  const [patients, setPatients] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const users = await adminApi('/users')
      const pts = users.filter(u => u.role === 'PATIENT')
      setPatients(pts)
      setFiltered(pts)
    } catch (e) { showToast('Lỗi tải bệnh nhân: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function search(q) {
    const lq = q.toLowerCase()
    setFiltered(patients.filter(u =>
      (u.full_name || '').toLowerCase().includes(lq) ||
      (u.username || '').toLowerCase().includes(lq) ||
      (u.phone || '').toLowerCase().includes(lq)
    ))
  }

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h2>Danh sách bệnh nhân <span className="adm-count">({filtered.length})</span></h2>
          <p className="adm-subtitle">Chế độ xem — không thể sửa hay xóa</p>
        </div>
        <input className="adm-search" placeholder="🔍 Tìm kiếm..." onChange={e => search(e.target.value)} />
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Họ tên</th><th>Username</th><th>SĐT</th><th>Ngày tạo</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5}><div className="adm-empty">👤 Chưa có bệnh nhân</div></td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td><span className="adm-muted">#{u.id}</span></td>
                  <td><b>{u.full_name || '—'}</b></td>
                  <td><code style={{ color: '#93c5fd' }}>{u.username}</code></td>
                  <td className="adm-muted">{u.phone || '—'}</td>
                  <td className="adm-muted" style={{ fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
