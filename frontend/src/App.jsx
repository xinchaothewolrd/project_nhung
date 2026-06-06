import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Topbar from './components/Topbar'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import RecordDetailPage from './pages/RecordDetailPage'

// Admin pages
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDevices from './pages/admin/AdminDevices'
import AdminRecords from './pages/admin/AdminRecords'

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorPatients from './pages/doctor/DoctorPatients'

// Bảo vệ route bệnh nhân
function PatientRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
  if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />
  return (
    <div className="app">
      <Topbar />
      <div className="wrap">{children}</div>
    </div>
  )
}

// Bảo vệ route Admin
function AdminRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

// Bảo vệ route Doctor
function DoctorRoute({ children }) {
  const { token, user } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (user?.role !== 'DOCTOR') return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { token, user } = useAuth()

  // Redirect từ / theo role
  function HomeRedirect() {
    if (!token) return <Navigate to="/login" replace />
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />
    if (user?.role === 'DOCTOR') return <Navigate to="/doctor" replace />
    return (
      <div className="app">
        <Topbar />
        <div className="wrap"><DashboardPage /></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <AuthPage />} />

      {/* Patient */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/record/:id" element={
        <PatientRoute><RecordDetailPage /></PatientRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminLayout role="ADMIN" /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="devices" element={<AdminDevices />} />
        <Route path="records" element={<AdminRecords canEdit={true} />} />
      </Route>

      {/* Doctor */}
      <Route path="/doctor" element={<DoctorRoute><AdminLayout role="DOCTOR" /></DoctorRoute>}>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="records" element={<AdminRecords canEdit={false} />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
