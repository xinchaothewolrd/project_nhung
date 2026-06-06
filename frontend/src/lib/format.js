// Tiện ích định dạng

export function fmtDate(s) {
  const d = new Date(s)
  if (isNaN(d)) return s || '—'
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function fmtDateShort(s) {
  const d = new Date(s)
  if (isNaN(d)) return '—'
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function fmtTime(s) {
  const d = new Date(s)
  if (isNaN(d)) return ''
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function initials(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}
