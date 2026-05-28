// src/store/modules/movies.js
import { defineStore } from 'pinia'
import api from '@/utils/axiosConfig'

export const useMoviesStore = defineStore('movies', {
  state: () => ({
    nowShowing: [],
    comingSoon: [],
    selectedMovie: null,
    searchQuery: '',
    filters: {
      language: [],
      genre: [],
      format: [],
    },
    loading: false,
    error: null,
  }),

  getters: {
    // All movies combined for filter/search operations
    allMovies: (state) => [...state.nowShowing, ...state.comingSoon],

    filteredMovies: (state) => {
      let movies = [...state.nowShowing, ...state.comingSoon]

      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase()
        movies = movies.filter(
          (m) =>
            m.title?.toLowerCase().includes(q) ||
            (typeof m.genres === 'string' && m.genres.toLowerCase().includes(q))
        )
      }

      if (state.filters.language.length > 0) {
        movies = movies.filter((m) =>
          state.filters.language.some(
            (lang) => m.language === lang || m.primary_language === lang
          )
        )
      }

      if (state.filters.genre.length > 0) {
        movies = movies.filter((m) => {
          const genreStr = typeof m.genres === 'string' ? m.genres : ''
          return state.filters.genre.some((g) => genreStr.includes(g))
        })
      }

      if (state.filters.format.length > 0) {
        movies = movies.filter((m) => {
          const fmtStr = typeof m.formats === 'string' ? m.formats : ''
          return state.filters.format.some((f) => fmtStr.includes(f))
        })
      }

      return movies
    },

    availableLanguages: (state) => {
      const langs = new Set()
      ;[...state.nowShowing, ...state.comingSoon].forEach((m) => {
        if (m.primary_language) langs.add(m.primary_language)
      })
      return Array.from(langs).sort()
    },

    availableGenres: (state) => {
      const genres = new Set()
      ;[...state.nowShowing, ...state.comingSoon].forEach((m) => {
        if (typeof m.genres === 'string') {
          m.genres.split(',').forEach((g) => g.trim() && genres.add(g.trim()))
        }
      })
      return Array.from(genres).sort()
    },

    availableFormats: (state) => {
      const formats = new Set()
      ;[...state.nowShowing, ...state.comingSoon].forEach((m) => {
        if (typeof m.formats === 'string') {
          m.formats.split(',').forEach((f) => f.trim() && formats.add(f.trim()))
        }
      })
      return Array.from(formats).sort()
    },
  },

  actions: {
    async fetchNowShowing() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('movies/nowShowing')
        this.nowShowing = res.data.movies || []
      } catch (err) {
        console.error('Failed to fetch now-showing movies:', err)
        this.error = 'Could not load now-showing movies.'
      } finally {
        this.loading = false
      }
    },

    async fetchComingSoon() {
      this.loading = true
      this.error = null
      try {
        const res = await api.get('movies/comingSoon')
        this.comingSoon = res.data.movies || []
      } catch (err) {
        console.error('Failed to fetch coming-soon movies:', err)
        this.error = 'Could not load coming-soon movies.'
      } finally {
        this.loading = false
      }
    },

    getMovieById(id) {
      return [...this.nowShowing, ...this.comingSoon].find(
        (m) => m.id === parseInt(id)
      )
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
      this.filters = { language: [], genre: [], format: [] }
      this.searchQuery = ''
    },
  },
})
