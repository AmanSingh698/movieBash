import { defineStore } from 'pinia'
import api from '@/utils/axiosConfig'

export const useBookingStore = defineStore('booking', {
  state: () => ({
    selectedMovie: null,
    selectedTheater: null,
    selectedShowtime: null,
    selectedSeats: [],
    allSeats: [],
    pricing: {},
    sessionId: null,
    lockExpiry: null,
    isLoading: false,
    bookingStep: 1, // 1: Select seats, 2: Confirm booking, 3: Payment
    currentTime: Date.now(), // Track current time for timer reactivity
  }),

  getters: {
    selectedSeatsCount: (state) => {
      return state.selectedSeats.length
    },

    totalPrice: (state) => {
      return state.selectedSeats.reduce((total, seat) => total + parseFloat(seat.price || 0), 0)
    },

    selectedSeatIds: (state) => {
      return state.selectedSeats.map((seat) => seat.id)
    },

    selectedSeatLabels: (state) => {
      return state.selectedSeats.map((seat) => seat.seat_label).join(', ')
    },

    timeRemaining: (state) => {
      if (!state.lockExpiry) return null
      // Use currentTime to make this reactive
      const now = state.currentTime
      const expiry = new Date(state.lockExpiry).getTime()
      const diff = expiry - now
      if (diff <= 0) return 0
      return Math.floor(diff / 1000) // seconds
    },

    bookingSummary() {
      return {
        movie: this.selectedMovie,
        theater: this.selectedTheater,
        showtime: this.selectedShowtime,
        seats: this.selectedSeats,
        seatsCount: this.selectedSeatsCount,
        totalPrice: this.totalPrice,
      }
    },

    isSeatSelected: (state) => (seatId) => {
      return state.selectedSeats.some((seat) => seat.id === seatId)
    },
  },

  actions: {
    updateCurrentTime() {
      this.currentTime = Date.now()
    },

    initializeSession() {
      // Try to recover from storage first
      const storedSession = sessionStorage.getItem('booking_session_id')

      if (storedSession) {
        this.sessionId = storedSession
      } else if (!this.sessionId) {
        this.sessionId = crypto.randomUUID()
        sessionStorage.setItem('booking_session_id', this.sessionId)
      }
    },

    initializeBooking({ movie, theater, showtime }) {
      this.initializeSession()
      this.selectedMovie = movie
      this.selectedTheater = theater
      this.selectedShowtime = showtime
      this.selectedSeats = []
      this.allSeats = [] // Clear all seats to prevent cross-show selection
      this.lockExpiry = null // Clear lock expiry
      this.bookingStep = 1
    },

    clearBooking() {
      // Clear session to start fresh
      sessionStorage.removeItem('booking_session_id')
      this.sessionId = null
      this.selectedSeats = []
      this.selectedMovie = null
      this.selectedTheater = null
      this.selectedShowtime = null
      this.allSeats = []
      this.lockExpiry = null
      this.initializeSession() // Create new session
    },

    async fetchSeatMap(showId) {
      this.isLoading = true
      try {
        const response = await api.get(`/bookings/seat-map/${showId}`)

        if (response.data.success) {
          const { show, seats, pricing } = response.data.data

          // Only update showtime if not already set (first load)
          if (!this.selectedShowtime || !this.selectedShowtime.id) {
            this.selectedShowtime = { ...this.selectedShowtime, ...show }
          }

          // Update seat statuses efficiently
          if (this.allSeats.length === 0) {
            // First load or after clearing - set all seats
            this.allSeats = seats
            this.pricing = pricing
          } else {
            // Subsequent loads (polling) - only update seat statuses for the SAME show
            // Check if we're still on the same show by comparing seat IDs
            const firstNewSeat = seats[0]
            const firstOldSeat = this.allSeats[0]

            if (firstNewSeat && firstOldSeat && firstNewSeat.id === firstOldSeat.id) {
              // Same show - update statuses only
              seats.forEach((updatedSeat) => {
                const existingSeatIndex = this.allSeats.findIndex((s) => s.id === updatedSeat.id)
                if (existingSeatIndex !== -1) {
                  // Update only status-related fields
                  this.allSeats[existingSeatIndex].status = updatedSeat.status
                  this.allSeats[existingSeatIndex].locked_by_session = updatedSeat.locked_by_session
                  this.allSeats[existingSeatIndex].locked_by_user = updatedSeat.locked_by_user
                  this.allSeats[existingSeatIndex].lock_expires_at = updatedSeat.lock_expires_at
                }
              })
            } else {
              // Different show - replace all seats
              this.allSeats = seats
              this.pricing = pricing
            }
          }

          // Restore previously selected seats ONLY if they're locked by this session AND for the current show
          // This prevents seats from previous shows being auto-selected
          if (this.selectedShowtime && show.id === this.selectedShowtime.id) {
            const myLockedSeats = this.allSeats.filter(
              (seat) => seat.status === 'locked' && seat.locked_by_session === this.sessionId,
            )

            // Only update selectedSeats if different
            if (
              JSON.stringify(this.selectedSeats.map((s) => s.id)) !==
              JSON.stringify(myLockedSeats.map((s) => s.id))
            ) {
              this.selectedSeats = myLockedSeats
            }
          }

          return response.data.data
        }
      } catch (error) {
        console.error('Error fetching seat map:', error)
        throw error
      } finally {
        this.isLoading = false
      }
    },

    async toggleSeat(seat) {
      const isSelected = this.isSeatSelected(seat.id)

      if (isSelected) {
        await this.releaseSeat(seat)
      } else {
        // Limit to maximum 10 seats
        if (this.selectedSeatsCount < 10) {
          await this.lockSeat(seat)
        }
      }
    },

    async lockSeat(seat) {
      try {
        console.log('Locking seat:', seat.seat_label, 'Price:', seat.price, 'Row:', seat.row_label)

        const response = await api.post('/bookings/lock-seats', {
          showId: this.selectedShowtime.id,
          seatIds: [seat.id],
          sessionId: this.sessionId,
        })

        if (response.data.success && response.data.data.lockedSeats.length > 0) {
          // Ensure the seat has a valid price before adding
          if (!seat.price || seat.price === 0) {
            console.warn('Seat has invalid price:', seat.seat_label, 'Price:', seat.price)
          }

          this.selectedSeats.push(seat)
          this.lockExpiry = response.data.data.expiresAt

          // Update seat status in allSeats
          const seatIndex = this.allSeats.findIndex((s) => s.id === seat.id)
          if (seatIndex !== -1) {
            this.allSeats[seatIndex].status = 'locked'
            this.allSeats[seatIndex].locked_by_session = this.sessionId
          }

          console.log('Total price after adding seat:', this.totalPrice)
        } else {
          const failedReason = response.data.data.failedSeats[0]?.reason || 'Seat unavailable'
          throw new Error(failedReason)
        }
      } catch (error) {
        console.error('Error locking seat:', error)
        throw error
      }
    },

    async releaseSeat(seat) {
      try {
        await api.post('/bookings/release-seats', {
          showId: this.selectedShowtime.id,
          seatIds: [seat.id],
          sessionId: this.sessionId,
        })

        this.selectedSeats = this.selectedSeats.filter((s) => s.id !== seat.id)

        // Update seat status in allSeats
        const seatIndex = this.allSeats.findIndex((s) => s.id === seat.id)
        if (seatIndex !== -1) {
          this.allSeats[seatIndex].status = 'available'
          this.allSeats[seatIndex].locked_by_session = null
        }

        if (this.selectedSeats.length === 0) {
          this.lockExpiry = null
        }
      } catch (error) {
        console.error('Error releasing seat:', error)
        throw error
      }
    },

    async releaseAllSeats() {
      if (this.selectedSeats.length === 0) return

      try {
        await api.post('/bookings/release-seats', {
          showId: this.selectedShowtime.id,
          seatIds: this.selectedSeatIds,
          sessionId: this.sessionId,
        })

        this.selectedSeats = []
        this.lockExpiry = null

        this.allSeats.forEach((seat) => {
          if (seat.locked_by_session === this.sessionId) {
            seat.status = 'available'
            seat.locked_by_session = null
          }
        })
      } catch (error) {
        console.error('Error releasing all seats:', error)
      }
    },

    clearSeats() {
      this.releaseAllSeats()
    },

    proceedToNextStep() {
      if (this.bookingStep < 3) {
        this.bookingStep++
      }
    },

    goToPreviousStep() {
      if (this.bookingStep > 1) {
        this.bookingStep--
      }
    },

    async confirmBooking() {
      try {
        const response = await api.post('/bookings/confirm', {
          showId: this.selectedShowtime.id,
          seatIds: this.selectedSeatIds,
          sessionId: this.sessionId,
          totalAmount: this.totalPrice,
          theatreId: this.selectedTheater.id,
        })

        if (response.data.success) {
          const bookingData = response.data.data
          this.resetBooking()
          return {
            success: true,
            bookingId: bookingData.bookingId,
            ...bookingData,
          }
        }
      } catch (error) {
        console.error('Error confirming booking:', error)
        throw error
      }
    },

    cancelBooking() {
      this.releaseAllSeats()
      this.resetBooking()
    },

    resetBooking() {
      this.selectedMovie = null
      this.selectedTheater = null
      this.selectedShowtime = null
      this.selectedSeats = []
      this.allSeats = []
      this.pricing = {}
      this.lockExpiry = null
      this.bookingStep = 1
    },
  },
})
