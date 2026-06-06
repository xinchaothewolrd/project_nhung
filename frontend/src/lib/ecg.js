// Đọc nội dung CSV ECG (dạng "timestamp,value", có hoặc không header) -> mảng [t, v]
export function parseECG(text) {
  const lines = text.trim().split(/\r?\n/)
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i].trim()
    if (!ln) continue
    if (i === 0 && /[a-z]/i.test(ln)) continue // bỏ dòng header
    const c = ln.split(',')
    let t, v
    if (c.length >= 2) {
      t = parseFloat(c[0])
      v = parseFloat(c[1])
    } else {
      t = i
      v = parseFloat(c[0])
    }
    if (!isNaN(v)) out.push([isNaN(t) ? i : t, v])
  }
  return out
}
