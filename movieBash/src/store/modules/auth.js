const state = {
  token: null,
  user: null,
}

const getters = {
  isAuthenticated: (state) => !!state.token,
  currentUser: (state) => state.user,
  authToken: (state) => state.token,
}

const mutations = {
  SET_TOKEN(state, token) {
    state.token = token
  },

  SET_USER(state, user) {
    state.user = user
  },

  CLEAR_AUTH(state) {
    state.token = null
    state.user = null
  },
}

const actions = {
  login({ commit }, { token, user }) {
    commit('SET_TOKEN', token)
    commit('SET_USER', user)
  },

  async logout({ commit }) {
    try {
      // Call backend to revoke refresh token
      const axios = require('axios').default
      await axios.post(
        'http://localhost:3000/api/auth/logout',
        {},
        {
          withCredentials: true,
        },
      )
    } catch (error) {
      console.error('Logout error:', error)
      // Continue with local logout even if backend call fails
    }
    commit('CLEAR_AUTH')
  },

  setToken({ commit }, token) {
    commit('SET_TOKEN', token)
  },

  setUser({ commit }, user) {
    commit('SET_USER', user)
  },

  async refreshToken({ commit }) {
    try {
      const axios = require('axios').default
      const response = await axios.post(
        'http://localhost:3000/api/auth/refresh',
        {},
        { withCredentials: true },
      )
      const newToken = response.data.accessToken
      commit('SET_TOKEN', newToken)
      return newToken
    } catch (error) {
      commit('CLEAR_AUTH')
      throw error
    }
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
