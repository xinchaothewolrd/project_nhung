// Logic diễn giải kết quả AI và chỉ số sinh tồn (tách riêng để dễ chỉnh/mở rộng).

// 5 nhóm nhịp tim của model. level: 'ok' | 'warn' | 'danger'
export const DIAG = {
  N: {
    label: 'Nhịp xoang bình thường',
    level: 'ok',
    desc: 'Tín hiệu điện tim đều và bình thường. Không phát hiện rối loạn nhịp trong lần đo này.',
  },
  L: {
    label: 'Block nhánh trái (LBBB)',
    level: 'warn',
    desc: 'Xung điện dẫn truyền chậm ở nhánh trái của tim. Cần được bác sĩ tim mạch đánh giá thêm, nhất là nếu kèm khó thở hay đau ngực.',
  },
  R: {
    label: 'Block nhánh phải (RBBB)',
    level: 'warn',
    desc: 'Xung điện dẫn truyền chậm ở nhánh phải. Thường lành tính nhưng nên kiểm tra để loại trừ bệnh tim nền.',
  },
  A: {
    label: 'Ngoại tâm thu nhĩ (PAC)',
    level: 'warn',
    desc: 'Xuất hiện nhịp đập sớm bắt nguồn từ tâm nhĩ. Thường gặp và phần lớn lành tính, nhưng nếu lặp lại nhiều nên theo dõi.',
  },
  V: {
    label: 'Ngoại tâm thu thất (PVC)',
    level: 'danger',
    desc: 'Xuất hiện nhịp đập sớm bắt nguồn từ tâm thất. Cần được bác sĩ tim mạch thăm khám sớm để đánh giá nguy cơ.',
  },
}

// Suy ra thông tin chẩn đoán từ 1 bản ghi (record) trả về từ backend
export function diagInfo(rec) {
  let code = (rec.ai_diagnosis_code || '').toUpperCase()
  const raw = rec.ai_diagnosis || ''
  if (!code) {
    const m = raw.match(/\b([NLRAV])\b/)
    if (m) code = m[1]
  }
  if (DIAG[code]) return { code, ...DIAG[code] }

  // các trạng thái đặc biệt từ backend
  if (/process/i.test(raw))
    return { code: '…', label: 'Đang phân tích', level: 'idle', desc: 'AI đang xử lý tín hiệu, vui lòng làm mới sau giây lát.' }
  if (/error/i.test(raw))
    return { code: '!', label: 'Lỗi phân tích', level: 'idle', desc: 'Không phân tích được tín hiệu lần đo này.' }
  return { code: '?', label: raw || 'Chưa có kết luận', level: 'idle', desc: 'Chưa có kết quả AI cho lần đo này.' }
}

// Ngưỡng tham khảo cho nhịp tim
export function bpmStat(v) {
  v = +v
  if (!v && v !== 0) return { tag: '—', cls: 'warn' }
  if (v < 60) return { tag: 'Nhịp chậm', cls: 'warn' }
  if (v > 100) return { tag: 'Nhịp nhanh', cls: 'warn' }
  return { tag: 'Bình thường', cls: 'ok' }
}

// Ngưỡng tham khảo cho SpO2
export function spo2Stat(v) {
  v = +v
  if (!v && v !== 0) return { tag: '—', cls: 'warn' }
  if (v < 90) return { tag: 'Thấp – chú ý', cls: 'danger' }
  if (v < 95) return { tag: 'Hơi thấp', cls: 'warn' }
  return { tag: 'Tốt', cls: 'ok' }
}

// Chuyển level chẩn đoán -> lớp màu badge/dot
export function levelClass(level) {
  if (level === 'ok') return 'ok'
  if (level === 'danger') return 'danger'
  if (level === 'idle') return 'idle'
  return 'warn'
}
