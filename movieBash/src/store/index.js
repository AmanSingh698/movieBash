import { createStore } from 'vuex'
import movies from './modules/movies'
import booking from './modules/booking'
import auth from './modules/auth'

export default createStore({
  modules: {
    movies,
    booking,
    auth,
  },
})
