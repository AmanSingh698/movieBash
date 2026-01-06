// src/utils/api.js
import axios from 'axios'
import { useAuthStore } from '../store/modules/auth'
import { goToLogin } from './navigation' // safe helper; falls back to window.location if not initialized

const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api' // adjust in .env

// plain axios instance used for refresh calls to avoid interceptor loops
const axiosRaw = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refresh cookie
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// main instance used by app (has interceptors)
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // important so browser sends refresh cookie to /refresh
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Refresh control
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

// Attach token from Pinia (reads fresh token each request)
api.interceptors.request.use(
  (config) => {
    try {
      const auth = useAuthStore()
      const token = auth.accessToken
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch (e) {
      // ignore if store not initialized
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor handles 401 -> try refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // if no response (network error) or no status, just reject
    if (!error.response) return Promise.reject(error)

    // don't try to refresh for login/refresh endpoints or if originalRequest._retry is true
    const status = error.response.status
    const requestUrl = originalRequest?.url || ''
    if (
      status !== 401 ||
      originalRequest._retry ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/login')
    ) {
      return Promise.reject(error)
    }

    // queue the requests while refresh in progress
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          originalRequest._retry = true
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    // start refresh
    originalRequest._retry = true
    isRefreshing = true

    const auth = useAuthStore()

    try {
      // call refresh endpoint using axiosRaw to avoid circular interceptor
      const refreshRes = await axiosRaw.post('/auth/refresh')
      const newAccessToken = refreshRes.data?.accessToken

      if (!newAccessToken) {
        throw new Error('No access token returned by refresh endpoint')
      }

      // store new token in Pinia (and localStorage if your store does that)
      auth.setAccessToken(newAccessToken)

      // update default header
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`

      // process queued requests
      processQueue(null, newAccessToken)

      // retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      isRefreshing = false
      return api(originalRequest)
    } catch (err) {
      // refresh failed -> clear auth and reject all queued requests
      processQueue(err, null)
      isRefreshing = false

      try {
        // clear Pinia
        auth.clearAuth()
      } catch (e) {
        // ignore
      }

      // clear localStorage keys used by auth (safe-guard)
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('auth_user')
      } catch (e) {
        // ignore
      }

      // Redirect user to login page using navigation helper (falls back to window.location)
      try {
        goToLogin()
      } catch (navErr) {
        // fallback
        try {
          window.location.href = '/login'
        } catch (e) {
          // ignore
        }
      }

      return Promise.reject(err)
    }
  },
)

export default api
export { axiosRaw }
