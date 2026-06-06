import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const RecordsContext = createContext(null)

export function RecordsProvider({ children }) {
  const { user, token } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user || !token) return
    setLoading(true)
    setError(null)
    try {
      const data = await api('/records/' + user.id, { token })
      setRecords(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, token])

  // Tự tải khi đã đăng nhập; xoá khi đăng xuất
  useEffect(() => {
    if (user && token) reload()
    else setRecords([])
  }, [user, token, reload])

  return (
    <RecordsContext.Provider value={{ records, loading, error, reload }}>
      {children}
    </RecordsContext.Provider>
  )
}

export function useRecords() {
  return useContext(RecordsContext)
}
