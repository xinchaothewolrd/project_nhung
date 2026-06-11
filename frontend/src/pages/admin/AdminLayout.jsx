// Shared layout cho ADMIN và DOCTOR — có sidebar + topbar
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PulseIcon } from '../../components/Icons'
import { initials } from '../../lib/format'

const NAV_ADMIN = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/users', label: 'Người dùng', icon: '👤' },
  { to: '/admin/devices', label: 'Thiết bị', icon: '📡' },
  { to: '/admin/records', label: 'Hồ sơ sức khỏe', icon: '🩺' },
]

const NAV_DOCTOR = [
  { to: '/doctor', label: 'Tổng quan', icon: '📊', end: true },
  { to: '/doctor/patients', label: 'Bệnh nhân', icon: '👤' },
  { to: '/doctor/records', label: 'Hồ sơ sức khỏe', icon: '🩺' },
]

export default function AdminLayout({ role }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const nav = role === 'ADMIN' ? NAV_ADMIN : NAV_DOCTOR

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`adm-shell${collapsed ? ' collapsed' : ''}`}>
      {/* ── SIDEBAR ── */}
      <aside className="adm-sidebar">
        <div className="adm-brand">
          <span className="adm-logo">🫀</span>
          {!collapsed && (
            <div className="adm-brand-text">
              <b>Health Admin</b>
              <small>{role === 'ADMIN' ? 'Admin Panel' : 'Doctor Portal'}</small>
            </div>
          )}
        </div>

        <button className="adm-collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>

        <nav className="adm-nav">
          {!collapsed && <div className="adm-nav-label">Menu chính</div>}
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          {!collapsed && (
            <div className="adm-user-info">
              <div className="adm-av">{initials(user?.full_name || user?.username)}</div>
              <div className="adm-who">
                <b>{user?.full_name || user?.username}</b>
                <span className={`adm-role-badge ${role === 'ADMIN' ? 'adm' : 'doc'}`}>
                  {role === 'ADMIN' ? '🔑 Admin' : '👨‍⚕️ Bác sĩ'}
                </span>
              </div>
            </div>
          )}
          <button className="adm-logout-btn" onClick={handleLogout}>
            <span>🚪</span>{!collapsed && ' Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="adm-main">
        <div className="adm-topbar">
          <div className="adm-page-title">
            Health Monitor <span>{role === 'ADMIN' ? 'Admin' : 'Doctor'}</span>
          </div>
          <div className="adm-status">
            <span className="adm-dot" />
            <span>Backend: localhost:5000</span>
          </div>
        </div>
        <div className="adm-content">
          <Outlet />
        </div>
      </main>

      <div id="adm-toast-root" />
    </div>
  )
}
