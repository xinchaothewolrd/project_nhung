import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRecords } from '../context/RecordsContext'
import { diagInfo, bpmStat, spo2Stat, levelClass } from '../lib/diagnosis'
import { fmtDate, fmtDateShort, fmtTime } from '../lib/format'
import TrendChart from '../components/TrendChart'
import { RefreshIcon, ChevronRight, PulseIcon } from '../components/Icons'

export default function DashboardPage() {
  const { user } = useAuth()
  const { records, loading, error, reload } = useRecords()
  const navigate = useNavigate()

  const firstName = (user?.full_name || user?.username || 'bạn').split(' ').pop()
  const last = records[0]

  // thống kê
  const valid = records.filter((r) => +r.bpm > 0)
  const avgBpm = valid.length ? Math.round(valid.reduce((a, r) => a + +r.bpm, 0) / valid.length) : '—'
  const abnormal = records.filter((r) => { const l = diagInfo(r).level; return l !== 'ok' && l !== 'idle' }).length

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Xin chào, <span>{firstName}</span></h1>
          <p className="lead">Tổng quan sức khỏe tim mạch của bạn.</p>
        </div>
        <button className="refresh" onClick={reload}>
          <RefreshIcon size={15} /> Làm mới
        </button>
      </div>

      {/* Lần đo gần nhất */}
      <div className="hero">
        <span className="label">Lần đo gần nhất</span>
        {last ? (
          <>
            <div className="hero-grid">
              <Vital name="❤ Nhịp tim" num={last.bpm ?? '—'} unit="bpm" stat={bpmStat(last.bpm)} />
              <Vital name="🫁 SpO₂" num={last.spo2 ?? '—'} unit="%" stat={spo2Stat(last.spo2)} unitInline />
              <div className="vital">
                <div className="v-name">🩺 Kết luận AI</div>
                <div className="v-num" style={{ fontSize: '1.5rem', lineHeight: 1.25, marginTop: 8 }}>{diagInfo(last).label}</div>
                <span className={'v-tag tag-' + (diagInfo(last).level === 'ok' ? 'ok' : diagInfo(last).level === 'danger' ? 'danger' : 'warn')}>
                  {diagInfo(last).level === 'ok' ? 'Ổn định' : 'Cần lưu ý'}
                </span>
              </div>
            </div>
            <div className="when">Đo lúc {fmtDate(last.createdAt)}</div>
          </>
        ) : (
          <>
            <div className="hero-grid"><div className="vital"><div className="v-name">Chưa có dữ liệu</div><div className="v-num">—</div></div></div>
            <div className="when">Hãy đeo thiết bị ESP32 và bắt đầu đo để xem kết quả tại đây.</div>
          </>
        )}
      </div>

      {/* Thống kê nhanh */}
      {records.length > 0 && (
        <div className="stat-row">
          <Stat name="Nhịp tim trung bình" num={avgBpm} unit=" bpm" sub={`qua ${valid.length} lần đo`} />
          <Stat name="SpO₂ gần nhất" num={last?.spo2 ?? '—'} unit="%" sub={spo2Stat(last?.spo2).tag} />
          <Stat name="Tổng số lần đo" num={records.length} sub="đã ghi nhận" />
          <Stat name="Lần bất thường" num={abnormal} sub={abnormal ? 'nên theo dõi' : 'không có'}
            color={abnormal ? 'var(--coral)' : 'var(--mint)'} />
        </div>
      )}

      {/* Xu hướng */}
      {records.length > 0 && (
        <div className="panel">
          <div className="panel-head"><div><h3>Xu hướng theo thời gian</h3><div className="sub">Nhịp tim & SpO₂ qua các lần đo</div></div></div>
          <TrendChart records={records} />
        </div>
      )}

      {/* Lịch sử */}
      <div className="panel">
        <div className="panel-head">
          <div><h3>Lịch sử bệnh án</h3>
            <div className="sub">{records.length ? `${records.length} lần đo · mới nhất ở trên` : 'Chưa có lần đo nào'}</div></div>
        </div>
        <div className="hist-head"><span /><span>Thời gian đo</span><span>Nhịp tim</span><span>SpO₂</span><span>Kết luận AI</span><span /></div>
        <div className="hist">
          {loading && records.length === 0 && <div className="empty"><p>Đang tải dữ liệu…</p></div>}
          {error && <div className="empty"><b>Không tải được dữ liệu</b><p>{error}</p></div>}
          {!loading && !error && records.length === 0 && (
            <div className="empty">
              <PulseIcon size={46} sw={1.5} />
              <b>Chưa có dữ liệu đo</b>
              <p>Khi thiết bị ESP32 gửi dữ liệu, các lần đo sẽ xuất hiện ở đây.</p>
            </div>
          )}
          {records.map((r) => {
            const di = diagInfo(r)
            const cls = levelClass(di.level)
            return (
              <div className="hist-row" key={r.id} onClick={() => navigate('/record/' + r.id)}>
                <span className={'dot ' + cls} />
                <div className="h-when"><b>{fmtDateShort(r.createdAt)}</b><span>{fmtTime(r.createdAt)}</span></div>
                <div className="h-metric">{r.bpm ?? '—'}<small> bpm</small></div>
                <div className="h-metric">{r.spo2 ?? '—'}<small>%</small></div>
                <div className="h-diag"><span className={'badge ' + cls}>{di.code}</span>{di.label}</div>
                <ChevronRight className="chev" size={18} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

function Vital({ name, num, unit, stat, unitInline }) {
  return (
    <div className="vital">
      <div className="v-name">{name}</div>
      <div className="v-num">{num}{unitInline ? <small>{unit}</small> : <> <small>{unit}</small></>}</div>
      <span className={'v-tag tag-' + stat.cls}>{stat.tag}</span>
    </div>
  )
}

function Stat({ name, num, unit, sub, color }) {
  return (
    <div className="stat">
      <div className="s-name">{name}</div>
      <div className="s-num" style={color ? { color } : undefined}>{num}{unit && <small>{unit}</small>}</div>
      <div className="s-sub">{sub}</div>
    </div>
  )
}
