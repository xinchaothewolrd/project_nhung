import { useState, useEffect, useCallback } from 'react'
import { adminApi, showToast, fmtDate, aiShort } from './adminUtils'
import { apiOrigin } from '../../api/client'
import EcgChart from '../../components/EcgChart'

// Component Records dùng chung cho cả Admin (canEdit=true) và Doctor (canEdit=false)
export default function AdminRecords({ canEdit = true }) {
  const [records, setRecords] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null) // record đang xem
  const [adviseModal, setAdviseModal] = useState(false)
  const [advise, setAdvise] = useState('')
  const [confirming, setConfirming] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi('/health-records')
      setRecords(data)
      setFiltered(data)
    } catch (e) { showToast('Lỗi tải hồ sơ: ' + e.message, 'err') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function search(q) {
    const lq = q.toLowerCase()
    setFiltered(records.filter(r =>
      (r.User?.full_name || '').toLowerCase().includes(lq) ||
      String(r.patient_id).includes(lq)
    ))
  }

  function openDetail(r) {
    setDetail(r)
    setAdvise(r.doctor_advise || '')
  }

  async function confirmRecord() {
    if (!detail) return
    setConfirming(true)
    try {
      await adminApi(`/health-records/${detail.id}`, {
        method: 'PUT', body: { doctor_confirm: true, doctor_advise: advise }
      })
      showToast('Bác sĩ đã xác nhận hồ sơ!')
      setDetail(null)
      setAdviseModal(false)
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
    finally { setConfirming(false) }
  }

  function recordsToCSV(list) {
    const headers = ['ID', 'Bệnh nhân', 'Thiết bị (MAC)', 'Thời gian đo', 'BPM', 'SpO2 (%)', 'Bác sĩ xác nhận', 'Lời khuyên bác sĩ']
    const rows = list.map(r => {
      const escapeCSV = v => `"${String(v ?? '').replace(/"/g, '""')}"`
      return [
        r.id,
        escapeCSV(r.User?.full_name || r.patient_id),
        escapeCSV(r.Device?.mac_address || r.device_id),
        escapeCSV(fmtDate(r.createdAt)),
        r.bpm ?? '',
        r.spo2 ?? '',
        r.doctor_confirm ? 'Đã xác nhận' : 'Chờ xác nhận',
        escapeCSV(r.doctor_advise || '')
      ].join(',')
    })
    return [headers.join(','), ...rows].join('\n')
  }

  function downloadCSV(csvContent, filename) {
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 2000)
  }

  function exportCSV() {
    if (!filtered.length) return showToast('Không có dữ liệu để xuất', 'err')
    const csv = recordsToCSV(filtered)
    downloadCSV(csv, `records_${Date.now()}.csv`)
    showToast('Đang tải file CSV!')
  }

  function exportRecordCSV() {
    if (!detail) return
    const csv = recordsToCSV([detail])
    downloadCSV(csv, `record_${detail.id}_${Date.now()}.csv`)
    showToast('Đang tải file CSV hồ sơ chi tiết!')
  }

  async function del(id) {
    if (!confirm(`Xóa hồ sơ #${id}?`)) return
    try {
      await adminApi(`/health-records/${id}`, { method: 'DELETE' })
      showToast('Đã xóa hồ sơ!')
      if (detail?.id === id) setDetail(null)
      load()
    } catch (e) { showToast('Lỗi: ' + e.message, 'err') }
  }

  function renderAI(txt) {
    if (!txt) return <span className="adm-badge yellow">PENDING</span>
    try {
      const obj = JSON.parse(txt)
      const d = obj.diagnosis || '?'
      const cls = d === 'NORMAL' ? 'green' : d === 'PENDING' ? 'yellow' : 'red'
      return <span className={`adm-badge ${cls}`}>{d}</span>
    } catch {
      return <span className="adm-badge yellow">{String(txt).slice(0, 20)}</span>
    }
  }

  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div><h2>Hồ sơ sức khỏe <span className="adm-count">({filtered.length})</span></h2></div>
        <div className="adm-actions">
          <input className="adm-search" placeholder="🔍 Tìm bệnh nhân..." onChange={e => search(e.target.value)} />
          <button className="adm-btn primary" onClick={exportCSV}>📥 Xuất CSV</button>
          <button className="adm-btn ghost sm" onClick={load}>↻ Làm mới</button>
        </div>
      </div>

      <div className="adm-card">
        {loading ? (
          <div className="adm-loader"><div className="adm-spinner" />Đang tải...</div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th><th>Bệnh nhân</th><th>Thiết bị</th>
                <th>BPM</th><th>SpO₂</th>
                <th>Bác sĩ</th><th>Thời gian</th><th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><div className="adm-empty">🩺 Chưa có hồ sơ nào</div></td></tr>
              ) : filtered.map(r => {
                const bpmColor = r.bpm > 100 || r.bpm < 60 ? '#f87171' : '#34d399'
                const spo2Color = r.spo2 < 95 ? '#f87171' : '#34d399'
                return (
                  <tr key={r.id}>
                    <td><span className="adm-muted">#{r.id}</span></td>
                    <td><b>{r.User?.full_name || r.patient_id}</b></td>
                    <td><code style={{ fontSize: 11, color: 'var(--adm-muted)' }}>{r.Device?.mac_address || r.device_id}</code></td>
                    <td><b style={{ color: bpmColor }}>{r.bpm ?? '—'}</b></td>
                    <td><b style={{ color: spo2Color }}>{r.spo2 ?? '—'}%</b></td>
                    <td>
                      {r.doctor_confirm
                        ? <span className="adm-badge green">✅ Xác nhận</span>
                        : <span className="adm-badge yellow">⏳ Chờ</span>}
                    </td>
                    <td className="adm-muted" style={{ fontSize: 11 }}>{fmtDate(r.createdAt)}</td>
                    <td>
                      <div className="adm-td-actions">
                        <button className="adm-btn warn sm" onClick={() => openDetail(r)}>🔍 Xem</button>
                        {canEdit && (
                          <button className="adm-btn danger sm" onClick={() => del(r.id)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      {detail && (
        <div className="adm-modal-bg" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="adm-modal wide">
            <div className="adm-modal-head">
              <h3>Chi tiết hồ sơ #{detail.id}</h3>
              <button className="adm-modal-close" onClick={() => setDetail(null)}>✕</button>
            </div>

            {/* ECG Chart */}
            {detail.ecg_file_url && (
              <div className="monitor-panel" style={{ marginBottom: 18 }}>
                <div className="monitor-head">
                  <div className="m-title"><span>HD</span> <span style={{ opacity: 0.5, fontSize: 10 }}>LEAD II</span></div>
                  <div className="live"><i></i> SIGNAL TRACE</div>
                </div>
                <EcgChart url={`${apiOrigin()}/${detail.ecg_file_url.replace(/^\//, '')}`} />
              </div>
            )}

            {/* Info grid */}
            <div className="adm-detail-grid">
              <InfoRow label="Bệnh nhân" value={<b>{detail.User?.full_name || detail.patient_id}</b>} />
              <InfoRow label="Thiết bị (MAC)" value={<code style={{ color: '#6ee7b7' }}>{detail.Device?.mac_address || detail.device_id}</code>} />
              <InfoRow label="Nhịp tim (BPM)"
                value={<span style={{ fontSize: 22, fontWeight: 800, color: detail.bpm > 100 || detail.bpm < 60 ? '#f87171' : '#34d399' }}>{detail.bpm ?? '—'}</span>} />
              <InfoRow label="SpO₂"
                value={<span style={{ fontSize: 22, fontWeight: 800, color: detail.spo2 < 95 ? '#f87171' : '#34d399' }}>{detail.spo2 ?? '—'}%</span>} />
              <InfoRow label="Thời gian đo" value={fmtDate(detail.createdAt)} />
              <InfoRow label="File ECG" value={
                detail.ecg_file_url
                  ? <a href={`${apiOrigin()}/${detail.ecg_file_url.replace(/^\//, '')}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>📁 Tải file ECG</a>
                  : <span className="adm-muted">Chưa có file</span>
              } />
            </div>

            {/* Doctor confirmed */}
            {detail.doctor_confirm && (
              <div className="adm-confirmed-box">
                <b>✅ Bác sĩ đã xác nhận</b>
                {detail.doctor_advise && <p>Lời khuyên: {detail.doctor_advise}</p>}
              </div>
            )}

            {/* Advise input (when confirming) */}
            {adviseModal && !detail.doctor_confirm && (
              <div className="adm-form-group" style={{ marginTop: 14 }}>
                <label>Lời khuyên của bác sĩ (có thể để trống)</label>
                <textarea rows={3} value={advise} onChange={e => setAdvise(e.target.value)}
                  placeholder="Nhập lời khuyên..." style={{ width: '100%', resize: 'vertical' }} />
              </div>
            )}

            <div className="adm-modal-foot">
              {!detail.doctor_confirm && !adviseModal && (
                <button className="adm-btn warn" onClick={() => setAdviseModal(true)}>✅ Xác nhận bác sĩ</button>
              )}
              {!detail.doctor_confirm && adviseModal && (
                <button className="adm-btn warn" onClick={confirmRecord} disabled={confirming}>
                  {confirming ? 'Đang lưu...' : '✅ Xác nhận & Lưu'}
                </button>
              )}
              <button className="adm-btn primary" onClick={exportRecordCSV}>📥 Tải CSV</button>
              <button className="adm-btn ghost" onClick={() => { setDetail(null); setAdviseModal(false) }}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="adm-info-row">
      <label>{label}</label>
      <div>{value}</div>
    </div>
  )
}
