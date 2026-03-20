import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const API_URL = ''

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('mf_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [token])

  async function fetchUser() {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        logout()
      }
    } catch (err) {
      logout()
    } finally {
      setLoading(false)
    }
  }

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('mf_token', data.token)
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  async function register(email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.token) {
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('mf_token', data.token)
      return { success: true }
    }
    return { success: false, error: data.error }
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('mf_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
