import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getApiBase, setApiBase } from '../api/client'
import { PulseIcon } from '../components/Icons'

export default function AuthPage() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [tab, setTab] = useState('login') // login | register
  const [msg, setMsg] = useState(null) // { text, type }
  const [busy, setBusy] = useState(false)

  // form đăng nhập
  const [li, setLi] = useState({ user: '', pass: '' })
  // form đăng ký
  const [rg, setRg] = useState({ name: '', phone: '', user: '', pass: '', dev: '' })

  // cấu hình máy chủ
  const [showApi, setShowApi] = useState(false)
  const [apiVal, setApiVal] = useState(getApiBase())

  const switchTab = (t) => { setTab(t); setMsg(null) }

  async function handleLogin() {
    if (!li.user || !li.pass) return setMsg({ text: 'Nhập đầy đủ tên đăng nhập và mật khẩu.', type: 'err' })
    setBusy(true); setMsg(null)
    try {
      await login(li.user.trim(), li.pass)
      navigate('/', { replace: true })
    } catch (e) {
      setMsg({ text: e.message, type: 'err' })
    } finally { setBusy(false) }
  }

  async function handleRegister() {
    if (!rg.name || !rg.phone || !rg.user || !rg.pass) return setMsg({ text: 'Vui lòng điền họ tên, số điện thoại, tên đăng nhập và mật khẩu.', type: 'err' })
    if (!rg.dev) return setMsg({ text: 'Vui lòng nhập mã thiết bị ESP32 (MAC) để gắn với tài khoản.', type: 'err' })
    if (rg.pass.length < 6) return setMsg({ text: 'Mật khẩu nên có tối thiểu 6 ký tự.', type: 'err' })
    setBusy(true); setMsg(null)
    try {
      await register({ full_name: rg.name.trim(), phone: rg.phone.trim(), username: rg.user.trim(), password: rg.pass, device: rg.dev.trim() })
      navigate('/', { replace: true })
    } catch (e) {
      setMsg({ text: e.message, type: 'err' })
    } finally { setBusy(false) }
  }

  const onEnter = (fn) => (e) => { if (e.key === 'Enter') fn() }

  return (
    <div className="auth">
      {/* Cột nghệ thuật */}
      <div className="auth-art">
        <div className="brand">
          <span className="logo"><PulseIcon size={24} color="#86E7C0" /></span>
          <span><b>CardioCare</b><small>ECG Monitor</small></span>
        </div>
        <div className="ecg-bg">
          <svg viewBox="0 0 800 160" preserveAspectRatio="none">
            <polyline fill="none" stroke="#86E7C0" strokeWidth="2"
              points="0,80 60,80 80,80 90,55 100,105 110,20 122,135 134,80 180,80 240,80 260,80 270,58 280,100 290,25 302,130 314,80 360,80 420,80 440,80 450,55 460,105 470,20 482,135 494,80 540,80 600,80 620,80 630,58 640,100 650,25 662,130 674,80 720,80 800,80" />
          </svg>
        </div>
        <div className="art-headline">
          <h2>Trái tim bạn,<br /><em>được lắng nghe</em> mỗi nhịp.</h2>
          <p>Thiết bị ESP32 ghi lại điện tâm đồ, AI sàng lọc rối loạn nhịp, và bạn xem lại từng nhịp Q-R-S ngay tại đây.</p>
        </div>
        <div className="art-foot">
          <div><b>18.000</b>điểm/lần đo</div>
          <div><b>5</b>nhóm nhịp tim</div>
          <div><b>24/7</b>lưu trữ</div>
        </div>
      </div>

      {/* Cột form */}
      <div className="auth-panel">
        <div className="auth-card">
          <h3>{tab === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản mới'}</h3>
          <p className="sub">{tab === 'login' ? 'Đăng nhập để xem kết quả đo của bạn.' : 'Đăng ký và gắn thiết bị ESP32 của bạn.'}</p>

          <div className="tabs">
            <button className={tab === 'login' ? 'on' : ''} onClick={() => switchTab('login')}>Đăng nhập</button>
            <button className={tab === 'register' ? 'on' : ''} onClick={() => switchTab('register')}>Đăng ký</button>
          </div>

          {msg && <div className={'msg ' + (msg.type === 'err' ? 'err' : 'ok')}>{msg.text}</div>}

          {tab === 'login' ? (
            <div>
              <div className="field"><label>Tên đăng nhập</label>
                <input value={li.user} autoComplete="username" placeholder="vd: nguyenvanA"
                  onChange={(e) => setLi({ ...li, user: e.target.value })} onKeyDown={onEnter(handleLogin)} /></div>
              <div className="field"><label>Mật khẩu</label>
                <input type="password" value={li.pass} autoComplete="current-password" placeholder="••••••••"
                  onChange={(e) => setLi({ ...li, pass: e.target.value })} onKeyDown={onEnter(handleLogin)} /></div>
              <button className="btn" disabled={busy} onClick={handleLogin}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
            </div>
          ) : (
            <div>
              <div className="field"><label>Họ và tên</label>
                <input value={rg.name} placeholder="Nguyễn Văn A"
                  onChange={(e) => setRg({ ...rg, name: e.target.value })} onKeyDown={onEnter(handleRegister)} /></div>
              <div className="field"><label>Số điện thoại</label>
                <input value={rg.phone} placeholder="vd: 0912345678"
                  onChange={(e) => setRg({ ...rg, phone: e.target.value })} onKeyDown={onEnter(handleRegister)} /></div>
              <div className="field"><label>Tên đăng nhập</label>
                <input value={rg.user} autoComplete="username" placeholder="Dùng để đăng nhập"
                  onChange={(e) => setRg({ ...rg, user: e.target.value })} onKeyDown={onEnter(handleRegister)} /></div>
              <div className="field"><label>Mật khẩu</label>
                <input type="password" value={rg.pass} autoComplete="new-password" placeholder="Tối thiểu 6 ký tự"
                  onChange={(e) => setRg({ ...rg, pass: e.target.value })} onKeyDown={onEnter(handleRegister)} /></div>
              <div className="field device"><label>Mã thiết bị ESP32 (MAC)</label>
                <input value={rg.dev} placeholder="AA:BB:CC:DD:EE:FF"
                  onChange={(e) => setRg({ ...rg, dev: e.target.value })} onKeyDown={onEnter(handleRegister)} />
                <div className="hint">Mã in trên thiết bị đo ECG của bạn — dùng để gắn thiết bị với tài khoản.</div></div>
              <button className="btn" disabled={busy} onClick={handleRegister}>{busy ? 'Đang tạo…' : 'Tạo tài khoản'}</button>
            </div>
          )}

          <div className="api-setting">
            <a onClick={() => setShowApi((s) => !s)}>Cấu hình địa chỉ máy chủ</a>
            {showApi && (
              <input value={apiVal} placeholder="http://localhost:5000/api"
                onChange={(e) => setApiVal(e.target.value)}
                onBlur={() => { if (apiVal.trim()) { setApiBase(apiVal.trim()); setMsg({ text: 'Đã lưu địa chỉ máy chủ.', type: 'ok' }) } }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
