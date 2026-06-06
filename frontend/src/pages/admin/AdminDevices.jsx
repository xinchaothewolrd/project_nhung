import { useState, useEffect, useCallback } from 'react'
import { adminApi, showToast, fmtDate } from './adminUtils'

export default function AdminDevices() {
  const [devices, setDevices] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ mac_address: '', patient_id: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [devs, usrs] = await Promise.all([adminApi('/devices'), adminApi('/users')])
      setDevices(devs)
      setUsers(usrs)
    } catch (e) { showToast('Lỗi tải thiết bị: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function saveDevice() {
    if (!form.mac_address) return showToast('Vui lòng nhập MAC Address', 'err')
    if (!form.patient_id) return showToast('Vui lòng chọn bệnh nhân', 'err')
    setSaving(true)
    try {
      await adminApi('/devices', { method: 'POST', body: { mac_address: form.mac_address.toUpperCase(), patient_id: +form.patient_id } })
      showToast('Thêm thiết bị thành công!')
      setModal(false)
      setForm({ mac_address: '', patient_id: '' })
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  async function del(mac) {
    if (!confirm(`Xóa thiết bị "${mac}"?`)) return
    try {
      await adminApi(`/devices/${mac}`, { method: 'DELETE' })
      showToast('Đã xóa thiết bị!')
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
  }

  const patients = users.filter(u => u.role === 'PATIENT')

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h2>Thiết bị ESP32 <span className="adm-count">({devices.length})</span></h2></div>
        <button className="adm-btn primary" onClick={() => setModal(true)}>+ Thêm thiết bị</button>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>MAC Address</th><th>Bệnh nhân</th><th>Ngày đăng ký</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr><td colSpan={4}><div className="adm-empty">📡 Chưa có thiết bị nào</div></td></tr>
              ) : devices.map((d, i) => {
                const patient = d.User?.full_name || users.find(u => u.id === d.patient_id)?.full_name || `ID: ${d.patient_id}`
                return (
                  <tr key={i}>
                    <td><code style={{ color: '#6ee7b7' }}>{d.mac_address}</code></td>
                    <td><b>{patient}</b></td>
                    <td className="adm-muted" style={{ fontSize: 12 }}>{fmtDate(d.createdAt)}</td>
                    <td>
                      <button className="adm-btn danger sm" onClick={() => del(d.mac_address)}>🗑 Xóa</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h3>Thêm thiết bị</h3>
              <button className="adm-modal-close" onClick={() => setModal(false)}>✕</button>
            </div>
            <div className="adm-form-group">
              <label>MAC Address</label>
              <input placeholder="AA:BB:CC:DD:EE:FF" value={form.mac_address}
                onChange={e => setForm(f => ({ ...f, mac_address: e.target.value }))} />
            </div>
            <div className="adm-form-group">
              <label>Bệnh nhân</label>
              <select value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                <option value="">-- Chọn bệnh nhân --</option>
                {patients.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.username} (ID:{u.id})</option>
                ))}
              </select>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn ghost" onClick={() => setModal(false)}>Hủy</button>
              <button className="adm-btn primary" onClick={saveDevice} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
