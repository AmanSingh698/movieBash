// src/stores/auth.js
import { defineStore } from 'pinia'
import { axiosRaw } from '@/utils/axiosConfig'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    accessToken: localStorage.getItem('accessToken') || null,
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
      localStorage.setItem('accessToken', token)
    },

    async logout() {
      try {
        // Call backend to revoke refresh token
        await axiosRaw.post('/auth/logout')
      } catch (error) {
        console.error('Logout error:', error)
        // Continue with local logout even if backend call fails
      }
      this.clearAuth()
    },

    clearAuth() {
      this.user = null
      this.accessToken = null
      localStorage.removeItem('user')
      localStorage.removeItem('accessToken')
    },
  },
})
