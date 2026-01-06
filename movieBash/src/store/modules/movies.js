import { defineStore } from 'pinia'
import { movies as mockMovies, theaters } from '@/data/mockMovies'

export const useMoviesStore = defineStore('movies', {
  state: () => ({
    allMovies: mockMovies,
    selectedMovie: null,
    searchQuery: '',
    filters: {
      language: [],
      genre: [],
      format: [],
    },
    theaters: theaters,
  }),

  getters: {
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
  },

  actions: {
    getMovieById(id) {
      return this.allMovies.find((movie) => movie.id === parseInt(id))
    },

    selectMovie(movie) {
      this.selectedMovie = movie
    },

    searchMovies(query) {
      this.searchQuery = query
    },

    updateLanguageFilter(languages) {
      this.filters.language = languages
    },

    updateGenreFilter(genres) {
      this.filters.genre = genres
    },

    updateFormatFilter(formats) {
      this.filters.format = formats
    },

    clearAllFilters() {
      this.filters = {
        language: [],
        genre: [],
        format: [],
      }
      this.searchQuery = ''
    },
  },
})
