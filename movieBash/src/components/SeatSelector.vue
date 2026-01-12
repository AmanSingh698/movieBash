<template>
    <div class="seat-selector">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="loader"></div>
            <p>Loading seats...</p>
        </div>

        <!-- Seat Map -->
        <div v-else-if="allSeats.length > 0">
            <!-- Lock Timer -->
            <div v-if="displayTime !== null && displayTime > 0" class="lock-timer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span>Seats locked for: {{ formatTime(displayTime) }}</span>
            </div>

            <!-- Seats Grid - Grouped by Seat Class -->
            <div class="seats-container">
                <div v-for="seatClass in seatClasses" :key="seatClass" class="seat-class-section">
                    <!-- Seat Class Header with Price -->
                    <div class="seat-class-header">
                        <span class="seat-class-price">₹{{ pricing[seatClass] }}</span>
                        <span class="seat-class-name">{{ seatClass.toUpperCase() }}</span>
                    </div>

                    <!-- Rows for this seat class -->
                    <div class="seat-class-rows">
                        <div v-for="row in getRowsForClass(seatClass)" :key="row" class="seat-row">
                            <div class="row-label">{{ row }}</div>
                            <div class="seats">
                                <button v-for="seat in getSeatsInRowAndClass(row, seatClass)" :key="seat.id"
                                    class="seat" :class="getSeatClass(seat)" :disabled="!canSelectSeat(seat)"
                                    @click="handleSeatClick(seat)"
                                    :title="`${seat.seat_label} - ${seat.seat_class} - ₹${seat.price}`">
                                    {{ seat.col_index }}
                                </button>
                            </div>
                            <!-- Duplicated Row Label for Right Side Removed -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Screen -->
            <div class="screen-container">
                <div class="screen-shape"></div>
                <p class="screen-label">All eyes this way please</p>
            </div>

            <!-- Seat Legend -->
            <div class="seat-legend">
                <div class="legend-item">
                    <div class="seat-icon seat-available-icon"></div>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <div class="seat-icon seat-selected-icon"></div>
                    <span>Selected</span>
                </div>
                <div class="legend-item">
                    <div class="seat-icon seat-sold-icon"></div>
                    <span>Sold</span>
                </div>
            </div>
        </div>

        <!-- Error State -->
        <div v-else class="error-state">
            <p>No seats available for this show</p>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useBookingStore } from '@/store/modules/booking'

const bookingStore = useBookingStore()

// State
const pollInterval = ref(null)
const timerInterval = ref(null)
const displayTime = ref(null)

// Computed
const allSeats = computed(() => bookingStore.allSeats)
const selectedSeats = computed(() => bookingStore.selectedSeats)
const pricing = computed(() => bookingStore.pricing)
const isLoading = computed(() => bookingStore.isLoading)
const timeRemaining = computed(() => bookingStore.timeRemaining)

// Get unique seat classes in order
const seatClasses = computed(() => {
    const classes = [...new Set(allSeats.value.map(seat => seat.seat_class))]
    // Define order: IMAX Premium, Gold, Premium, Silver (case-insensitive)
    const order = ['imax premium', 'gold', 'premium', 'silver']
    return classes.sort((a, b) => {
        const indexA = order.indexOf(a?.toLowerCase())
        const indexB = order.indexOf(b?.toLowerCase())
        if (indexA === -1 && indexB === -1) return a.localeCompare(b)
        if (indexA === -1) return 1
        if (indexB === -1) return -1
        return indexA - indexB
    })
})

// Get unique row labels for a specific seat class
const getRowsForClass = (seatClass) => {
    const rows = [...new Set(
        allSeats.value
            .filter(seat => seat.seat_class === seatClass)
            .map(seat => seat.row_label)
    )]
    return rows.sort()
}

// Get seats in a specific row (legacy - keep for compatibility)
const getSeatsInRow = (row) => {
    return allSeats.value
        .filter(seat => seat.row_label === row)
        .sort((a, b) => a.col_index - b.col_index)
}

// Get seats in a specific row and class
const getSeatsInRowAndClass = (row, seatClass) => {
    return allSeats.value
        .filter(seat => seat.row_label === row && seat.seat_class === seatClass)
        .sort((a, b) => a.col_index - b.col_index)
}

const getSeatClass = (seat) => {
    const classes = ['seat']

    // Status-based classes
    if (seat.status === 'booked') {
        classes.push('seat-booked')
    } else if (seat.status === 'locked') {
        if (seat.locked_by_session === bookingStore.sessionId) {
            classes.push('seat-selected')
        } else {
            classes.push('seat-locked')
        }
    } else {
        classes.push('seat-available')
    }

    // Seat class-based styling
    const seatClassLower = seat.seat_class?.toLowerCase()
    if (seatClassLower) {
        classes.push(`seat-${seatClassLower}`)
    }

    return classes.join(' ')
}

const canSelectSeat = (seat) => {
    // Can't select if booked
    if (seat.status === 'booked') return false

    // Can't select if locked by another user
    if (seat.status === 'locked' && seat.locked_by_session !== bookingStore.sessionId) {
        return false
    }

    return true
}

const handleSeatClick = async (seat) => {
    try {
        await bookingStore.toggleSeat(seat)
    } catch (error) {
        console.error('Error toggling seat:', error)
        alert(error.message || 'Failed to select seat. Please try again.')
    }
}

const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Polling for real-time updates - DISABLED to prevent page reloads
// Seats will update when user selects/deselects
const startPolling = () => {
    // Disabled - uncomment if you need real-time updates
    // pollInterval.value = setInterval(async () => {
    //     if (bookingStore.selectedShowtime?.id) {
    //         try {
    //             await bookingStore.fetchSeatMap(bookingStore.selectedShowtime.id)
    //         } catch (error) {
    //             console.error('Error polling seat map:', error)
    //         }
    //     }
    // }, 30000) // Poll every 30 seconds if enabled
}

const stopPolling = () => {
    if (pollInterval.value) {
        clearInterval(pollInterval.value)
        pollInterval.value = null
    }
}

// Lifecycle
onMounted(() => {
    // Polling disabled - seats update on user actions only
    // startPolling()

    // Start timer countdown - update store's currentTime every second
    timerInterval.value = setInterval(() => {
        // Update the store's current time to trigger reactivity
        bookingStore.updateCurrentTime()

        // Update display time
        const remaining = timeRemaining.value
        if (remaining !== null && remaining >= 0) {
            displayTime.value = remaining
        } else {
            displayTime.value = null
        }
    }, 1000)
})

onUnmounted(() => {
    stopPolling()
    if (timerInterval.value) {
        clearInterval(timerInterval.value)
        timerInterval.value = null
    }
})
</script>

<style scoped>
.seat-selector {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
    padding-bottom: 60px;
}

.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    gap: var(--spacing-lg);
}

.loader {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(168, 85, 247, 0.2);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.lock-timer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    background: rgba(236, 72, 153, 0.1);
    border: 1px solid rgba(236, 72, 153, 0.3);
    border-radius: var(--radius-lg);
    color: #ec4899;
    font-weight: 600;
}

/* Screen Styles */
.screen-container {
    margin-top: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}

.screen-shape {
    width: 280px;
    height: 40px;
    background: linear-gradient(to bottom, #e0f2fe, rgba(224, 242, 254, 0));
    transform: perspective(100px) rotateX(-10deg);
    box-shadow: 0 -10px 20px -5px rgba(56, 189, 248, 0.1);
    border-top: 4px solid #bae6fd;
    opacity: 0.8;
}

.screen-label {
    color: var(--color-text-muted);
    font-size: 12px;
    color: #94a3b8;
}

/* Legend Styles */
.seat-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #f1f5f9;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
}

.seat-icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid;
}

.seat-bestseller-icon {
    border-color: #f59e0b;
    background: #fff;
}

.seat-available-icon {
    border-color: #10b981;
    background: #fff;
}

.seat-selected-icon {
    border-color: #10b981;
    background: #10b981;
}

.seat-sold-icon {
    border-color: #e2e8f0;
    background: #e2e8f0;
}

/* Seats Container */
.seats-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding: 0;
    background: transparent;
}

.seat-class-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 16px;
}

.seat-class-header::after {
    /* Divider line */
    content: '';
    display: none;
    /* Handled by border-bottom */
}

.seat-class-price {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
}

.seat-class-name {
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    text-transform: uppercase;
}

.seat-class-rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.seat-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
}

.row-label {
    width: 20px;
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    font-weight: 500;
}

.seats {
    display: flex;
    gap: 8px;
}

/* Seat Styles */
.seat {
    width: 28px;
    height: 28px;
    border: 1px solid #e2e8f0;
    /* Default border */
    background: #fff;
    border-radius: 2px;
    /* Square with slight radius */
    font-size: 10px;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.seat:disabled {
    cursor: not-allowed;
}

/* Colors for Seat Tiers - All Available seats are Green */
.seat-gold,
.seat-premium,
.seat-imax,
.seat-platinum,
.seat-silver,
.seat-classic {
    border-color: #10b981;
    color: #10b981;
}

/* Selected State - Overrides class colors */
.seat-selected {
    background: #10b981 !important;
    /* Force green fill */
    border-color: #10b981 !important;
    color: white !important;
    box-shadow: none;
    transform: none;
}

/* Booked/Sold State */
.seat-booked {
    background: #e2e8f0 !important;
    border-color: #e2e8f0 !important;
    color: transparent !important;
    /* Hide number */
    cursor: not-allowed;
}

/* Locked State (treated as Sold for others) */
.seat-locked {
    background: #e2e8f0 !important;
    border-color: #e2e8f0 !important;
    color: transparent !important;
    cursor: not-allowed;
}

.seat-locked::after {
    content: '';
    /* Remove lock icon */
}

/* Hover Effects */
.seat-available:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.pricing-info {
    display: none;
    /* Hide old pricing info */
}

/* Responsive */
@media (max-width: 768px) {
    .seat {
        width: 24px;
        height: 24px;
        font-size: 9px;
    }

    .seats {
        gap: 4px;
    }
}
</style>
