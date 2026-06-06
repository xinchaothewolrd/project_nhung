import { createContext, useContext, useState, useCallback } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

const ls = {
  get(k) { try { return localStorage.getItem(k) } catch { return null } },
  set(k, v) { try { localStorage.setItem(k, v) } catch { /* ignore */ } },
  del(k) { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => ls.get('cc_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(ls.get('cc_user') || 'null') } catch { return null }
  })

  const login = useCallback(async (username, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { username, password } })
    setToken(data.token)
    setUser(data.user)
    ls.set('cc_token', data.token)
    ls.set('cc_user', JSON.stringify(data.user))
    return data
  }, [])

  const register = useCallback(async ({ full_name, username, password, device }) => {
    // Gửi kèm mã ESP32 (mac_address & device_id) để backend liên kết thiết bị với tài khoản
    await api('/auth/register', {
      method: 'POST',
      body: {
        username,
        password,
        full_name,
        role: 'PATIENT',
        mac_address: device.toUpperCase(),
        device_id: device.toUpperCase(),
      },
    })
    // Lưu mã thiết bị phía client để hiển thị (backend hiện chưa trả về mã này)
    ls.set('cc_dev_' + username, device.toUpperCase())
    return login(username, password) // tự động đăng nhập sau khi đăng ký
  }, [login])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    ls.del('cc_token')
    ls.del('cc_user')
  }, [])

  const deviceFor = useCallback((username) => ls.get('cc_dev_' + username), [])

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, deviceFor }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
