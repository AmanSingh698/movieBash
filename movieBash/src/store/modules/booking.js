const state = {
  selectedMovie: null,
  selectedTheater: null,
  selectedShowtime: null,
  selectedSeats: [],
  bookingStep: 1, // 1: Select seats, 2: Confirm booking, 3: Payment
  totalPrice: 0,
}

const getters = {
  selectedSeatsCount: (state) => {
    return state.selectedSeats.length
  },

  totalPrice: (state) => {
    return state.selectedSeats.reduce((total, seat) => total + seat.price, 0)
  },

  bookingSummary: (state, getters) => {
    return {
      movie: state.selectedMovie,
      theater: state.selectedTheater,
      showtime: state.selectedShowtime,
      seats: state.selectedSeats,
      seatsCount: getters.selectedSeatsCount,
      totalPrice: getters.totalPrice,
    }
  },

  isSeatSelected: (state) => (seatId) => {
    return state.selectedSeats.some((seat) => seat.id === seatId)
  },
}

const mutations = {
  SET_BOOKING_MOVIE(state, movie) {
    state.selectedMovie = movie
  },

  SET_BOOKING_THEATER(state, theater) {
    state.selectedTheater = theater
  },

  SET_BOOKING_SHOWTIME(state, showtime) {
    state.selectedShowtime = showtime
  },

  ADD_SEAT(state, seat) {
    state.selectedSeats.push(seat)
  },

  REMOVE_SEAT(state, seatId) {
    state.selectedSeats = state.selectedSeats.filter((seat) => seat.id !== seatId)
  },

  CLEAR_SEATS(state) {
    state.selectedSeats = []
  },

  SET_BOOKING_STEP(state, step) {
    state.bookingStep = step
  },

  RESET_BOOKING(state) {
    state.selectedMovie = null
    state.selectedTheater = null
    state.selectedShowtime = null
    state.selectedSeats = []
    state.bookingStep = 1
    state.totalPrice = 0
  },
}

const actions = {
  initializeBooking({ commit }, { movie, theater, showtime }) {
    commit('SET_BOOKING_MOVIE', movie)
    commit('SET_BOOKING_THEATER', theater)
    commit('SET_BOOKING_SHOWTIME', showtime)
    commit('CLEAR_SEATS')
    commit('SET_BOOKING_STEP', 1)
  },

  toggleSeat({ commit, getters }, seat) {
    if (getters.isSeatSelected(seat.id)) {
      commit('REMOVE_SEAT', seat.id)
    } else {
      // Limit to maximum 10 seats
      if (getters.selectedSeatsCount < 10) {
        commit('ADD_SEAT', seat)
      }
    }
  },

  clearSeats({ commit }) {
    commit('CLEAR_SEATS')
  },

  proceedToNextStep({ commit, state }) {
    if (state.bookingStep < 3) {
      commit('SET_BOOKING_STEP', state.bookingStep + 1)
    }
  },

  goToPreviousStep({ commit, state }) {
    if (state.bookingStep > 1) {
      commit('SET_BOOKING_STEP', state.bookingStep - 1)
    }
  },

  confirmBooking({ commit, state }) {
    // This will be replaced with actual API call
    console.log('Booking confirmed:', state)
    return new Promise((resolve) => {
      setTimeout(() => {
        commit('RESET_BOOKING')
        resolve({
          success: true,
          bookingId: 'BK' + Date.now(),
        })
      }, 1000)
    })
  },

  cancelBooking({ commit }) {
    commit('RESET_BOOKING')
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
