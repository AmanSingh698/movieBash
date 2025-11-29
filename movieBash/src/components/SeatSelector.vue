<template>
    <div class="seat-selector">
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
                <div class="seat-icon seat-booked"></div>
                <span>Booked</span>
            </div>
        </div>

        <!-- Seats Grid -->
        <div class="seats-container">
            <div v-for="row in seatLayout.rows" :key="row" class="seat-row">
                <div class="row-label">{{ row }}</div>
                <div class="seats">
                    <button v-for="seatNum in seatLayout.seatsPerRow" :key="`${row}-${seatNum}`" class="seat"
                        :class="getSeatClass(row, seatNum)" :disabled="isSeatBooked(row, seatNum)"
                        @click="toggleSeat(row, seatNum)">
                        {{ seatNum }}
                    </button>
                </div>
                <div class="row-label">{{ row }}</div>
            </div>
        </div>

        <!-- Seat Type Pricing -->
        <div class="pricing-info">
            <div v-for="(type, key) in seatLayout.seatTypes" :key="key" class="price-item">
                <span class="seat-type-name">{{ type.name }}</span>
                <span class="seat-type-rows">({{ type.rows.join(', ') }})</span>
                <span class="seat-type-price">₹{{ type.price }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { seatLayout } from '@/data/mockMovies'

const store = useStore()

// Mock booked seats (in real app, this would come from backend)
const bookedSeats = ['A-5', 'A-6', 'B-8', 'B-9', 'C-10', 'D-5', 'D-6', 'E-12', 'F-7', 'F-8']

const selectedSeats = computed(() => store.state.booking.selectedSeats)

const getSeatType = (row) => {
    for (const [key, type] of Object.entries(seatLayout.seatTypes)) {
        if (type.rows.includes(row)) {
            return { key, ...type }
        }
    }
    return null
}

const getSeatClass = (row, seatNum) => {
    const seatId = `${row}-${seatNum}`
    const seatType = getSeatType(row)

    if (isSeatBooked(row, seatNum)) {
        return 'seat-booked'
    }

    if (isSeatSelected(seatId)) {
        return 'seat-selected'
    }

    return `seat-available seat-${seatType?.key || 'regular'}`
}

const isSeatBooked = (row, seatNum) => {
    return bookedSeats.includes(`${row}-${seatNum}`)
}

const isSeatSelected = (seatId) => {
    return selectedSeats.value.some(seat => seat.id === seatId)
}

const toggleSeat = (row, seatNum) => {
    const seatId = `${row}-${seatNum}`
    const seatType = getSeatType(row)

    const seat = {
        id: seatId,
        row,
        number: seatNum,
        type: seatType.name,
        price: seatType.price
    }

    store.dispatch('booking/toggleSeat', seat)
}
</script>

<style scoped>
.seat-selector {
    width: 100%;
    max-width: 900px;
    margin: 0 auto;
}

.screen-container {
    margin-bottom: var(--spacing-3xl);
    padding: var(--spacing-xl) 0;
}

.screen {
    text-align: center;
}

.screen-label {
    margin-top: var(--spacing-md);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 2px;
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
}

.seats-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xl);
    padding: var(--spacing-lg);
    background: var(--color-bg-card);
    border-radius: var(--radius-xl);
    overflow-x: auto;
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
    background: var(--color-bg-tertiary);
    border-color: rgba(255, 255, 255, 0.2);
    color: var(--color-text-secondary);
}

.seat-available:hover {
    border-color: var(--color-accent-primary);
    transform: scale(1.1);
}

.seat-regular {
    border-color: #3b82f6;
}

.seat-premium {
    border-color: #a855f7;
}

.seat-vip {
    border-color: #ec4899;
}

.seat-selected {
    background: var(--gradient-primary);
    border-color: var(--color-accent-primary);
    color: white;
    transform: scale(1.1);
}

.seat-booked {
    background: var(--color-bg-secondary);
    border-color: rgba(255, 255, 255, 0.1);
    color: var(--color-text-muted);
    cursor: not-allowed;
    opacity: 0.5;
}

.seat:disabled {
    cursor: not-allowed;
}

.pricing-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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

.seat-type-rows {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
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
