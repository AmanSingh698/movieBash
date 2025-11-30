import axios from 'axios'
import store from '@/store'
import router from '@/router'

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Important: send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Request interceptor - attach access token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getters['auth/authToken']
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor - handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
        .catch((err) => {
          return Promise.reject(err)
        })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // Call refresh endpoint (refresh token sent automatically via cookie)
      const response = await axios.post(
        'http://localhost:3000/api/auth/refresh',
        {},
        { withCredentials: true },
      )

      const newAccessToken = response.data.accessToken

      // Update token in Vuex store
      store.dispatch('auth/setToken', newAccessToken)

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`

      // Process queued requests
      processQueue(null, newAccessToken)

      isRefreshing = false

      // Retry original request
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      // Refresh failed - logout user
      processQueue(refreshError, null)
      isRefreshing = false

      // Clear auth state
      store.dispatch('auth/logout')

      // Redirect to login
      router.push('/login')

      return Promise.reject(refreshError)
    }
  },
)

export default axiosInstance
