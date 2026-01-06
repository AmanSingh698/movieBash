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

            <!-- Screen -->
            <div class="screen-container">
                <div class="screen">
                    <svg width="100%" height="40" viewBox="0 0 400 40" fill="none">
                        <path d="M0 40 Q200 0 400 40" stroke="url(#screenGradient)" stroke-width="3" fill="none" />
                        <defs>
                            <linearGradient id="screenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#a855f7;stop-opacity:0.3" />
                                <stop offset="50%" style="stop-color:#ec4899;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#a855f7;stop-opacity:0.3" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <p class="screen-label">Screen This Way</p>
                </div>
            </div>

            <!-- Seat Legend -->
            <div class="seat-legend">
                <div class="legend-item">
                    <div class="seat-icon seat-available"></div>
                    <span>Available</span>
                </div>
                <div class="legend-item">
                    <div class="seat-icon seat-selected"></div>
                    <span>Selected</span>
                </div>
                <div class="legend-item">
                    <div class="seat-icon seat-locked"></div>
                    <span>Locked</span>
                </div>
                <div class="legend-item">
                    <div class="seat-icon seat-booked"></div>
                    <span>Booked</span>
                </div>
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
                            <div class="row-label">{{ row }}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Seat Type Pricing -->
            <div class="pricing-info" v-if="Object.keys(pricing).length > 0">
                <div v-for="(price, seatClass) in pricing" :key="seatClass" class="price-item">
                    <span class="seat-type-name">{{ seatClass }}</span>
                    <span class="seat-type-price">₹{{ price }}</span>
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

.screen-container {
    margin-bottom: var(--spacing-3xl);
    padding: var(--spacing-2xl) 0;
}

.screen {
    text-align: center;
}

.screen svg {
    filter: drop-shadow(0 4px 20px rgba(236, 72, 153, 0.4));
}

.screen-label {
    margin-top: var(--spacing-lg);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 3px;
    font-weight: 600;
}

.seat-legend {
    display: flex;
    justify-content: center;
    gap: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-md);
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
}

.legend-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.seat-icon {
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    border: 2px solid;
}

.seats-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2xl);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-xl);
    background: var(--color-bg-card);
    border-radius: var(--radius-xl);
    overflow-x: auto;
}

.seat-class-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-xl);
    border-bottom: 2px solid rgba(255, 255, 255, 0.05);
}

.seat-class-section:last-child {
    border-bottom: none;
    padding-bottom: 0;
}

.seat-class-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-lg);
    background: rgba(168, 85, 247, 0.1);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-md);
}

.seat-class-price {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
}

.seat-class-name {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.seat-class-rows {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
}

.seat-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.row-label {
    min-width: 30px;
    text-align: center;
    font-weight: 600;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.seats {
    display: flex;
    gap: var(--spacing-xs);
    flex: 1;
    justify-content: center;
}

.seat {
    width: 32px;
    height: 32px;
    border: 2px solid;
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
}

.seat-available {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.4);
    color: #10b981;
}

.seat-available:hover {
    background: rgba(16, 185, 129, 0.25);
    border-color: #10b981;
    transform: scale(1.1);
}

.seat-silver {
    border-color: rgba(148, 163, 184, 0.3);
}

.seat-gold {
    border-color: rgba(251, 191, 36, 0.3);
}

.seat-platinum,
.seat-premium {
    border-color: rgba(168, 85, 247, 0.3);
}

.seat-selected {
    background: linear-gradient(135deg, #10b981, #059669);
    border-color: #059669;
    color: white;
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
}

.seat-locked {
    background: rgba(251, 191, 36, 0.2);
    border-color: #fbbf24;
    color: #fbbf24;
    cursor: not-allowed;
    position: relative;
}

.seat-locked::after {
    content: '🔒';
    position: absolute;
    font-size: 10px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.seat-booked {
    background: rgba(107, 114, 128, 0.3);
    border-color: rgba(107, 114, 128, 0.4);
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.6;
}

.seat:disabled {
    cursor: not-allowed;
}

.pricing-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
}

.price-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border-radius: var(--radius-md);
}

.seat-type-name {
    font-weight: 600;
    color: var(--color-text-primary);
}

.seat-type-price {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-accent-primary);
}

/* Responsive */
@media (max-width: 768px) {
    .seat {
        width: 28px;
        height: 28px;
        font-size: 10px;
    }

    .seats {
        gap: 4px;
    }

    .pricing-info {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 576px) {
    .seat {
        width: 24px;
        height: 24px;
    }

    .seat-legend {
        flex-direction: column;
        gap: var(--spacing-sm);
    }
}
</style>
