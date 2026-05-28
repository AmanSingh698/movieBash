// src/stores/auth.js
import { defineStore } from 'pinia'
import { axiosRaw } from '@/utils/axiosConfig'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // user profile is safe to persist (no secrets)
    user: JSON.parse(localStorage.getItem('user')) || null,
    // Fix #7: accessToken stays in memory ONLY — never persisted to localStorage
    // (Stored in localStorage it is readable by any JS on the page = XSS risk)
    accessToken: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    getAccessToken: (state) => state.accessToken,
    getUser: (state) => state.user,
  },

  actions: {
    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },

    setAccessToken(token) {
      this.accessToken = token
      // ✅ Do NOT write to localStorage — memory only
    },

    /**
     * Called once on app boot (App.vue onMounted).
     * Silently tries to get a new access token from the httpOnly refresh cookie.
     * If the cookie is valid the user is restored to an authenticated state
     * without ever touching localStorage.
     */
    async initAuth() {
      try {
        const res = await axiosRaw.post('/auth/refresh')
        const newToken = res.data?.accessToken
        if (newToken) {
          this.setAccessToken(newToken)
        }
      } catch {
        // Refresh cookie missing / expired — leave user as guest
        this.clearAuth()
      }
    },

    async logout() {
      try {
        await axiosRaw.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
      }
      this.clearAuth()
    },

    clearAuth() {
      this.user = null
      this.accessToken = null
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken') // clean up legacy key if it exists
    },
  },
})
