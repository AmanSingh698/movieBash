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

  logout({ commit }) {
    commit('CLEAR_AUTH')
  },

  setToken({ commit }, token) {
    commit('SET_TOKEN', token)
  },

  setUser({ commit }, user) {
    commit('SET_USER', user)
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
