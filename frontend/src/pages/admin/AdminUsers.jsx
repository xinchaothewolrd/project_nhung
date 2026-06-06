import { useState, useEffect, useCallback } from 'react'
import { adminApi, showToast, fmtDate } from './adminUtils'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode:'add'|'edit', data }
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi('/users')
      setUsers(data)
      setFiltered(data)
    } catch (e) { showToast('Lỗi tải users: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function search(q) {
    const lq = q.toLowerCase()
    setFiltered(users.filter(u =>
      (u.full_name || '').toLowerCase().includes(lq) ||
      (u.username || '').toLowerCase().includes(lq) ||
      (u.phone || '').toLowerCase().includes(lq)
    ))
  }

  function openAdd() {
    setForm({ full_name: '', username: '', password: '', phone: '', role: 'PATIENT' })
    setModal({ mode: 'add' })
  }

  function openEdit(u) {
    setForm({ id: u.id, full_name: u.full_name || '', username: u.username, phone: u.phone || '', role: u.role, password: '' })
    setModal({ mode: 'edit' })
  }

  async function save() {
    if (!form.username) return showToast('Vui lòng nhập username', 'err')
    if (modal.mode === 'add' && !form.password) return showToast('Vui lòng nhập mật khẩu', 'err')
    setSaving(true)
    try {
      if (modal.mode === 'edit') {
        const body = { full_name: form.full_name, username: form.username, role: form.role, phone: form.phone }
        if (form.password) body.password = form.password
        await adminApi(`/users/${form.id}`, { method: 'PUT', body })
        showToast('Cập nhật thành công!')
      } else {
        await adminApi('/users', { method: 'POST', body: form })
        showToast('Thêm người dùng thành công!')
      }
      setModal(null)
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
    finally { setSaving(false) }
  }

  async function del(u) {
    if (!confirm(`Xóa người dùng "${u.full_name || u.username}"? Không thể hoàn tác!`)) return
    try {
      await adminApi(`/users/${u.id}`, { method: 'DELETE' })
      showToast('Đã xóa người dùng!')
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div>
          <h2>Người dùng <span className="adm-count">({filtered.length})</span></h2>
        </div>
        <div className="adm-actions">
          <input className="adm-search" placeholder="🔍 Tìm kiếm..." onChange={e => search(e.target.value)} />
          <button className="adm-btn primary" onClick={openAdd}>+ Thêm người dùng</button>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>ID</th><th>Họ tên</th><th>Username</th><th>Vai trò</th><th>SĐT</th><th>Ngày tạo</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><div className="adm-empty">👤 Chưa có người dùng</div></td></tr>
              ) : filtered.map(u => (
                <tr key={u.id}>
                  <td><span className="adm-muted">#{u.id}</span></td>
                  <td><b>{u.full_name || '—'}</b></td>
                  <td><code style={{ color: '#93c5fd' }}>{u.username}</code></td>
                  <td>
                    <span className={`adm-badge ${u.role === 'DOCTOR' ? 'purple' : u.role === 'ADMIN' ? 'red' : 'blue'}`}>
                      {u.role === 'DOCTOR' ? '👨‍⚕️ Bác sĩ' : u.role === 'ADMIN' ? '🔑 Admin' : '🧑 Bệnh nhân'}
                    </span>
                  </td>
                  <td className="adm-muted">{u.phone || '—'}</td>
                  <td className="adm-muted" style={{ fontSize: 12 }}>{fmtDate(u.createdAt)}</td>
                  <td>
                    <div className="adm-td-actions">
                      <button className="adm-btn warn sm" onClick={() => openEdit(u)}>✏️ Sửa</button>
                      <button className="adm-btn danger sm" onClick={() => del(u)}>🗑️ Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Add/Edit */}
      {modal && (
        <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="adm-modal">
            <div className="adm-modal-head">
              <h3>{modal.mode === 'add' ? 'Thêm người dùng' : 'Chỉnh sửa người dùng'}</h3>
              <button className="adm-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="adm-form-grid">
              <Field label="Họ và tên" value={form.full_name} onChange={v => setForm(f => ({ ...f, full_name: v }))} placeholder="Nguyễn Văn A" />
              <Field label="Số điện thoại" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="0912345678" />
              <Field label="Username" value={form.username} onChange={v => setForm(f => ({ ...f, username: v }))} placeholder="nguyenvana" />
              <Field label={`Mật khẩu${modal.mode === 'edit' ? ' (để trống = không đổi)' : ''}`} type="password" value={form.password} onChange={v => setForm(f => ({ ...f, password: v }))} placeholder="••••••••" />
            </div>
            <div className="adm-form-group">
              <label>Vai trò</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="PATIENT">🧑 Bệnh nhân (PATIENT)</option>
                <option value="DOCTOR">👨‍⚕️ Bác sĩ (DOCTOR)</option>
                <option value="ADMIN">🔑 Admin (ADMIN)</option>
              </select>
            </div>
            <div className="adm-modal-foot">
              <button className="adm-btn ghost" onClick={() => setModal(null)}>Hủy</button>
              <button className="adm-btn primary" onClick={save} disabled={saving}>{saving ? 'Đang lưu...' : '💾 Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div className="adm-form-group">
      <label>{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
