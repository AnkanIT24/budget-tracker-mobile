import axios from 'axios'
import { getToken, clearSession, saveSession, getUser } from './storage'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api'

/**
 * The web app did `window.location.href = '/login'` on a 401.
 * There is no window here, so AuthContext registers a callback instead.
 */
let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// Async interceptor — AsyncStorage reads are promises.
const isPublicAuthRequest = (url = '') =>
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password')

// Async interceptor — AsyncStorage reads are promises.
api.interceptors.request.use(async (config) => {
  const token = await getToken()
  if (token && !isPublicAuthRequest(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const isPublicRequest = isPublicAuthRequest(error.config?.url)
    if (error.response?.status === 401 && !isPublicRequest) {
      await clearSession()
      if (onUnauthorized) onUnauthorized()
    }
    return Promise.reject(error)
  }
)

/** Pulls a usable message out of an axios error. */
export const errMsg = (error, fallback = 'Something went wrong') => {
  if (error?.code === 'ECONNABORTED') return 'Request timed out'
  if (!error?.response) return 'Cannot reach the server. Check EXPO_PUBLIC_API_URL.'
  return error.response?.data?.message || fallback
}

export const authService = {
  register: (data) => api.post('/auth/register', data).then((r) => r.data),
  login:    (data) => api.post('/auth/login', data).then((r) => r.data),
  // Backend README lists POST, the web client calls PUT. Kept as PUT to match
  // the working web client — flip it if your controller says otherwise.
  changePassword: (data) => api.put('/auth/change-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
  saveSession,
  clearSession,
  getUser,
}

export const categoryService = {
  getAll:    ()         => api.get('/categories').then((r) => r.data),
  getByType: (type)     => api.get('/categories', { params: { type } }).then((r) => r.data),
  create:    (data)     => api.post('/categories', data).then((r) => r.data),
  update:    (id, data) => api.put(`/categories/${id}`, data).then((r) => r.data),
  delete:    (id)       => api.delete(`/categories/${id}`),
}

export const transactionService = {
  getAll:     (params)      => api.get('/transactions', { params }).then((r) => r.data),
  create:     (data)        => api.post('/transactions', data).then((r) => r.data),
  update:     (id, data)    => api.put(`/transactions/${id}`, data).then((r) => r.data),
  delete:     (id)          => api.delete(`/transactions/${id}`),
  getSummary: (month, year) => api.get('/transactions/summary', { params: { month, year } }).then((r) => r.data),
}

export const budgetService = {
  getAll:    (month, year) => api.get('/budgets', { params: { month, year } }).then((r) => r.data),
  create:    (data)        => api.post('/budgets', data).then((r) => r.data),
  update:    (id, data)    => api.put(`/budgets/${id}`, data).then((r) => r.data),
  delete:    (id)          => api.delete(`/budgets/${id}`),
  getStatus: (month, year) => api.get('/budgets/status', { params: { month, year } }).then((r) => r.data),
}

// AI endpoints already implemented by the Spring Boot backend.
// The chat request body is { message } and the response contains { response }.
export const aiService = {
  getContext: () => api.get('/ai/context').then((r) => r.data),
  chat: (data) => api.post('/ai/chat', data, { timeout: 90000 }).then((r) => r.data),
  getRecommendations: () => api.get('/ai/recommendations').then((r) => r.data),
  getAnomalies: () => api.get('/ai/anomalies').then((r) => r.data),
}

export default api
