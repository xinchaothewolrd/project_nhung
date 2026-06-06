import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRecords } from '../context/RecordsContext'
import { apiOrigin } from '../api/client'
import { diagInfo, bpmStat, spo2Stat } from '../lib/diagnosis'
import { fmtDate } from '../lib/format'
import EcgChart from '../components/EcgChart'
import BookModal from '../components/BookModal'
import {
  ArrowLeft, CheckIcon, AlertTriangle, InfoCircle, HeartIcon,
  DropletIcon, CalendarIcon, StethIcon, PhoneIcon, PulseIcon,
} from '../components/Icons'

export default function RecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { records, loading } = useRecords()
  const [bookOpen, setBookOpen] = useState(false)

  const rec = records.find((r) => String(r.id) === String(id))

  if (!rec) {
    return (
      <>
        <BackLink onClick={() => navigate('/')} />
        <div className="empty">
          {loading ? <p>Đang tải dữ liệu…</p> : <><b>Không tìm thấy lần đo</b><p>Bản ghi này không tồn tại hoặc đã bị xoá.</p></>}
        </div>
      </>
    )
  }

  const di = diagInfo(rec)
  const lv = di.level
  const bs = bpmStat(rec.bpm)
  const s2 = spo2Stat(rec.spo2)
  const confirmed = rec.doctor_confirm === true || rec.doctor_confirm === 1
  const ecgUrl = rec.ecg_file_url ? apiOrigin() + rec.ecg_file_url : null

  return (
    <>
      <BackLink onClick={() => navigate('/')} />

      <div className="report-top">
        {/* Kết luận AI */}
        <div className={'verdict ' + lv}>
          <span className="icon">
            {lv === 'ok' ? <CheckIcon size={40} color="#fff" sw={2} />
              : lv === 'danger' ? <AlertTriangle size={40} color="#fff" sw={2} />
                : <InfoCircle size={40} color="#fff" sw={2} />}
          </span>
          <div className="v-code">Kết luận AI · Mã {di.code}</div>
          <h2>{di.label}</h2>
          <p>{di.desc}</p>
        </div>

        {/* Chỉ số sinh tồn */}
        <div className="mini-vitals">
          <MiniVital icon={<HeartIcon size={18} />} label="Nhịp tim" value={rec.bpm ?? '—'} unit=" bpm" tag={bs} />
          <MiniVital icon={<DropletIcon size={18} />} label="SpO₂" value={rec.spo2 ?? '—'} unit="%" tag={s2} />
          <div className="mv">
            <div className="mv-l"><CalendarIcon size={18} />Thời gian đo</div>
            <div className="mv-r" style={{ fontSize: '1rem' }}>{fmtDate(rec.createdAt)}</div>
          </div>
        </div>
      </div>

      {/* Cảnh báo & lời khuyên nhân văn */}
      <AdviceBox level={lv} di={di} onBook={() => setBookOpen(true)} />

      {/* Màn hình ECG */}
      <div className="monitor-panel">
        <div className="monitor-head">
          <div className="m-title">
            <PulseIcon size={16} color="var(--trace)" />
            ĐIỆN TÂM ĐỒ (ECG) · LEAD II
          </div>
          <div className="live"><i /> RECORDED</div>
        </div>
        <EcgChart url={ecgUrl} />
        <div className="monitor-hint">
          <span>🖱️ Lăn chuột để Zoom</span>
          <span>✋ Kéo để di chuyển (Pan)</span>
          <span>⛶ Kéo thanh trượt phía dưới để xem toàn cảnh</span>
        </div>
      </div>

      {/* Nhận định bác sĩ */}
      <div className="doc-note">
        <div className="dn-head">
          <StethIcon size={20} />
          <b>Nhận định của bác sĩ</b>
          <span className={'stamp ' + (confirmed ? 'yes' : 'no')}>{confirmed ? '✓ Đã xác nhận' : 'Chờ bác sĩ'}</span>
        </div>
        {rec.doctor_advise
          ? <p>{rec.doctor_advise}</p>
          : <p className="nodoc">Chưa có lời khuyên từ bác sĩ cho lần đo này. Bác sĩ sẽ xem xét và phản hồi sớm.</p>}
      </div>

      <p className="disclaimer">
        ⚕️ Kết quả do AI sàng lọc tự động chỉ mang tính tham khảo, <b>không thay thế chẩn đoán của bác sĩ</b>.
        Nếu bạn thấy đau ngực, khó thở, choáng hoặc ngất, hãy gọi cấp cứu 115 ngay lập tức.
      </p>

      <BookModal open={bookOpen} onClose={() => setBookOpen(false)} />
    </>
  )
}

function BackLink({ onClick }) {
  return (
    <a className="back" onClick={onClick}>
      <ArrowLeft size={16} /> Quay lại danh sách
    </a>
  )
}

function MiniVital({ icon, label, value, unit, tag }) {
  return (
    <div className="mv">
      <div className="mv-l">{icon}{label}</div>
      <div className="mv-r">{value}<small>{unit}</small><span className={'pill c-' + tag.cls}>{tag.tag}</span></div>
    </div>
  )
}

function AdviceBox({ level, di, onBook }) {
  if (level === 'ok') {
    return (
      <div className="alert ok">
        <span className="a-ic"><CheckIcon size={22} color="#fff" sw={2.4} /></span>
        <div>
          <h4>Tim bạn đang ổn định</h4>
          <p>Lần đo này không phát hiện rối loạn nhịp. Hãy duy trì lối sống lành mạnh, ngủ đủ giấc và đo định kỳ để theo dõi.</p>
        </div>
      </div>
    )
  }
  if (level === 'idle') {
    return (
      <div className="alert warn">
        <span className="a-ic"><InfoCircle size={22} color="#fff" sw={2.4} /></span>
        <div><h4>Chưa có kết quả phân tích</h4><p>{di.desc} Bạn có thể bấm “Làm mới” sau ít phút.</p></div>
      </div>
    )
  }

  // warn hoặc danger
  const danger = level === 'danger'
  return (
    <div className={'alert ' + (danger ? 'danger' : 'warn')}>
      <span className="a-ic"><AlertTriangle size={22} color="#fff" sw={2.4} /></span>
      <div>
        <h4>{danger ? 'Phát hiện dấu hiệu cần chú ý' : 'Phát hiện bất thường nhẹ'}</h4>
        <p>
          {di.desc}{' '}
          {danger ? (
            <>Đây không phải chẩn đoán cuối cùng, nhưng bạn <b>nên đi khám bác sĩ tim mạch sớm</b>. Nếu đang đau ngực dữ dội, khó thở, vã mồ hôi hoặc choáng ngất, hãy gọi cấp cứu ngay.</>
          ) : (
            <>Hầu hết trường hợp là lành tính, nhưng nên đặt lịch khám để bác sĩ kiểm tra và yên tâm hơn.</>
          )}
        </p>
        <div className="acts">
          {danger && (
            <a className="act sos" href="tel:115"><PhoneIcon size={16} color="#fff" />Gọi cấp cứu 115</a>
          )}
          <button className="act book" onClick={onBook}><CalendarIcon size={16} color="#fff" />Đặt lịch khám bác sĩ</button>
        </div>
      </div>
    </div>
  )
}
