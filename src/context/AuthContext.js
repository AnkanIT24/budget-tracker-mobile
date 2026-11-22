import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService, setUnauthorizedHandler } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // The web app read localStorage synchronously in useState. AsyncStorage is
  // async, so we need an explicit bootstrap gate or the app flashes the login
  // screen on every cold start.
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let alive = true
    authService.getUser()
      .then((u) => { if (alive) setUser(u) })
      .finally(() => { if (alive) setBooting(false) })
    return () => { alive = false }
  }, [])

  const logout = useCallback(async () => {
    await authService.clearSession()
    setUser(null)
  }, [])

  // Token expired mid-session -> axios interceptor fires this.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null))
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = useCallback(async (data) => {
    const res = await authService.login(data)
    await authService.saveSession(res)
    setUser({ fullName: res.fullName, email: res.email })
    return res
  }, [])

  const register = useCallback(async (data) => {
    const res = await authService.register(data)
    await authService.saveSession(res)
    setUser({ fullName: res.fullName, email: res.email })
    return res
  }, [])

  return (
    <AuthContext.Provider value={{ user, booting, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
