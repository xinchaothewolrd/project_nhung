// Lớp giao tiếp với backend. Toàn bộ fetch đi qua đây để dễ quản lý.

const DEFAULT_API = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

// localStorage an toàn (không làm vỡ app nếu môi trường chặn storage)
const ls = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
}

// Cho phép đổi địa chỉ máy chủ lúc chạy (ghi đè .env), tiện khi demo trên máy/điện thoại khác
export function getApiBase() {
  return ls.get('cc_api') || DEFAULT_API
}
export function setApiBase(v) {
  ls.set('cc_api', v)
}

// Gốc server (bỏ '/api') để tải file tĩnh như /uploads/ecg/xxx.csv
export function apiOrigin() {
  return getApiBase().replace(/\/?api\/?$/, '').replace(/\/$/, '')
}

/**
 * Gọi API JSON.
 * @param {string} path  ví dụ '/auth/login'
 * @param {object} opts  { method, body, token }
 */
export async function api(path, { method = 'GET', body = null, token = null } = {}) {
  const headers = {}
  let payload = null
  if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (token) headers['Authorization'] = 'Bearer ' + token

  let res
  try {
    res = await fetch(getApiBase() + path, { method, headers, body: payload })
  } catch {
    throw new Error(
      `Không kết nối được tới máy chủ (${getApiBase()}). Kiểm tra backend đã chạy chưa.`
    )
  }

  let data = null
  try { data = await res.json() } catch { /* body rỗng */ }

  if (!res.ok) {
    throw new Error((data && (data.error || data.message)) || `Lỗi ${res.status}`)
  }
  return data
}
