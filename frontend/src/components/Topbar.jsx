import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PulseIcon } from './Icons'
import { initials } from '../lib/format'

export default function Topbar() {
  const { user, logout, deviceFor } = useAuth()
  const navigate = useNavigate()
  const dev = user ? deviceFor(user.username) : null

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="topbar">
      <div className="brand">
        <span className="logo"><PulseIcon size={24} color="#fff" /></span>
        <span><b>CardioCare</b><small>Patient App</small></span>
      </div>
      <div className="user-chip">
        <div className="who" style={{ textAlign: 'right' }}>
          <b>{user?.full_name || user?.username || '—'}</b>
          <span>{dev ? 'ESP32 · ' + dev : '@' + (user?.username || '')}</span>
        </div>
        <div className="av">{initials(user?.full_name || user?.username)}</div>
        <button className="logout" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  )
}
