// Tiện ích toast + api dùng chung trong admin/doctor pages
import { api } from '../../api/client'

// lấy token từ localStorage
function getToken() {
  try { return localStorage.getItem('cc_token') } catch { return null }
}

// Gọi API với auth
export async function adminApi(path, opts = {}) {
  return api(path, { ...opts, token: getToken() })
}

// Toast đơn giản
export function showToast(msg, type = 'ok') {
  const root = document.getElementById('adm-toast-root')
  if (!root) return
  const el = document.createElement('div')
  el.className = `adm-toast ${type}`
  el.innerHTML = `<span>${type === 'ok' ? '✅' : '❌'}</span><span>${msg}</span>`
  root.appendChild(el)
  setTimeout(() => el.remove(), 3200)
}

// Helpers format
export function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN')
}

export function roleBadge(r) {
  const map = {
    DOCTOR: '<span class="adm-badge purple">👨‍⚕️ Bác sĩ</span>',
    ADMIN: '<span class="adm-badge red">🔑 Admin</span>',
    PATIENT: '<span class="adm-badge blue">🧑 Bệnh nhân</span>',
  }
  return map[r] || `<span class="adm-badge">${r}</span>`
}

export function aiShort(txt) {
  if (!txt) return '<span class="adm-badge yellow">PENDING</span>'
  try {
    const obj = JSON.parse(txt)
    const d = obj.diagnosis || '?'
    const cls = d === 'NORMAL' ? 'green' : d === 'PENDING' ? 'yellow' : 'red'
    return `<span class="adm-badge ${cls}">${d}</span>`
  } catch {
    return `<span class="adm-badge yellow">${String(txt).slice(0, 20)}</span>`
  }
}
