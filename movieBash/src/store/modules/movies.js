import { movies as mockMovies, theaters } from '@/data/mockMovies'

const state = {
  allMovies: mockMovies,
  featuredMovies: [],
  nowShowingMovies: [],
  comingSoonMovies: [],
  selectedMovie: null,
  searchQuery: '',
  filters: {
    language: [],
    genre: [],
    format: [],
  },
  theaters: theaters,
}

const getters = {
  featuredMovies: (state) => {
    return state.allMovies.filter((movie) => movie.featured)
  },

  nowShowingMovies: (state) => {
    return state.allMovies.filter((movie) => movie.status === 'now-showing')
  },

  comingSoonMovies: (state) => {
    return state.allMovies.filter((movie) => movie.status === 'coming-soon')
  },

  filteredMovies: (state) => {
    let filtered = state.allMovies

    // Apply search query
    if (state.searchQuery) {
      filtered = filtered.filter(
        (movie) =>
          movie.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
          movie.genre.some((g) => g.toLowerCase().includes(state.searchQuery.toLowerCase())),
      )
    }

    // Apply language filter
    if (state.filters.language.length > 0) {
      filtered = filtered.filter((movie) =>
        movie.language.some((lang) => state.filters.language.includes(lang)),
      )
    }

    // Apply genre filter
    if (state.filters.genre.length > 0) {
      filtered = filtered.filter((movie) =>
        movie.genre.some((genre) => state.filters.genre.includes(genre)),
      )
    }

    // Apply format filter
    if (state.filters.format.length > 0) {
      filtered = filtered.filter((movie) =>
        movie.format.some((format) => state.filters.format.includes(format)),
      )
    }

    return filtered
  },

  getMovieById: (state) => (id) => {
    return state.allMovies.find((movie) => movie.id === parseInt(id))
  },

  availableLanguages: (state) => {
    const languages = new Set()
    state.allMovies.forEach((movie) => {
      movie.language.forEach((lang) => languages.add(lang))
    })
    return Array.from(languages).sort()
  },

  availableGenres: (state) => {
    const genres = new Set()
    state.allMovies.forEach((movie) => {
      movie.genre.forEach((genre) => genres.add(genre))
    })
    return Array.from(genres).sort()
  },

  availableFormats: (state) => {
    const formats = new Set()
    state.allMovies.forEach((movie) => {
      movie.format.forEach((format) => formats.add(format))
    })
    return Array.from(formats).sort()
  },
}

const mutations = {
  SET_SELECTED_MOVIE(state, movie) {
    state.selectedMovie = movie
  },

  SET_SEARCH_QUERY(state, query) {
    state.searchQuery = query
  },

  SET_LANGUAGE_FILTER(state, languages) {
    state.filters.language = languages
  },

  SET_GENRE_FILTER(state, genres) {
    state.filters.genre = genres
  },

  SET_FORMAT_FILTER(state, formats) {
    state.filters.format = formats
  },

  CLEAR_FILTERS(state) {
    state.filters = {
      language: [],
      genre: [],
      format: [],
    }
    state.searchQuery = ''
  },
}

const actions = {
  selectMovie({ commit }, movie) {
    commit('SET_SELECTED_MOVIE', movie)
  },

  searchMovies({ commit }, query) {
    commit('SET_SEARCH_QUERY', query)
  },

  updateLanguageFilter({ commit }, languages) {
    commit('SET_LANGUAGE_FILTER', languages)
  },

  updateGenreFilter({ commit }, genres) {
    commit('SET_GENRE_FILTER', genres)
  },

  updateFormatFilter({ commit }, formats) {
    commit('SET_FORMAT_FILTER', formats)
  },

  clearAllFilters({ commit }) {
    commit('CLEAR_FILTERS')
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
