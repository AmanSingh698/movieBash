<template>
    <div class="booking-page" v-if="bookingSummary.movie">
        <div class="container">
            <div class="booking-layout">
                <!-- Main Content -->
                <div class="booking-main">
                    <div class="booking-header">
                        <button class="btn btn-ghost btn-sm" @click="goBack">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                            Back
                        </button>
                        <h1 class="page-title">Select Seats</h1>
                    </div>

                    <div class="movie-info-bar glass">
                        <div class="movie-info-content">
                            <img :src="bookingSummary.movie.poster" :alt="bookingSummary.movie.title"
                                class="movie-poster-small" />
                            <div class="movie-details-small">
                                <h3>{{ bookingSummary.movie.title }}</h3>
                                <p>{{ bookingSummary.theater?.name }}</p>
                                <p class="showtime-info">
                                    {{ bookingSummary.showtime?.time }} • {{
                                        formatDate(bookingSummary.movie.releaseDate) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <SeatSelector />
                </div>

                <!-- Sidebar Summary -->
                <div class="booking-sidebar">
                    <div class="summary-card glass-strong">
                        <h3 class="summary-title">Booking Summary</h3>

                        <div class="summary-section">
                            <div class="summary-item">
                                <span class="summary-label">Movie</span>
                                <span class="summary-value">{{ bookingSummary.movie.title }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Theater</span>
                                <span class="summary-value">{{ bookingSummary.theater?.name }}</span>
                            </div>
                            <div class="summary-item">
                                <span class="summary-label">Showtime</span>
                                <span class="summary-value">{{ bookingSummary.showtime?.time }}</span>
                            </div>
                        </div>

                        <div class="summary-section" v-if="bookingSummary.seatsCount > 0">
                            <h4 class="summary-subtitle">Selected Seats</h4>
                            <div class="selected-seats-list">
                                <span v-for="seat in bookingSummary.seats" :key="seat.id" class="seat-tag">
                                    {{ seat.id }}
                                </span>
                            </div>
                        </div>

                        <div class="summary-section">
                            <div class="summary-item">
                                <span class="summary-label">Tickets</span>
                                <span class="summary-value">{{ bookingSummary.seatsCount }}</span>
                            </div>
                            <div class="summary-item total-price">
                                <span class="summary-label">Total Amount</span>
                                <span class="summary-value gradient-text">₹{{ bookingSummary.totalPrice }}</span>
                            </div>
                        </div>

                        <button class="btn btn-primary" :disabled="bookingSummary.seatsCount === 0"
                            @click="proceedToPayment">
                            Proceed to Payment
                        </button>

                        <p class="booking-note">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                            </svg>
                            You can select up to 10 seats
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="loading-state">
        <div class="loader"></div>
        <p>Loading booking details...</p>
    </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import SeatSelector from '@/components/SeatSelector.vue'

const store = useStore()
const router = useRouter()
const route = useRoute()

const bookingSummary = computed(() => store.getters['booking/bookingSummary'])

const goBack = () => {
    router.back()
}

const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const proceedToPayment = () => {
    // In real app, this would navigate to payment page
    alert(`Proceeding to payment for ${bookingSummary.value.seatsCount} tickets. Total: ₹${bookingSummary.value.totalPrice}`)

    // For demo, we'll just confirm the booking
    store.dispatch('booking/confirmBooking').then((result) => {
        if (result.success) {
            alert(`Booking confirmed! Booking ID: ${result.bookingId}`)
            router.push('/')
        }
    })
}

onMounted(() => {
    if (!bookingSummary.value.movie) {
        router.push('/')
    }
})
</script>

<style scoped>
.booking-page {
    min-height: 100vh;
    padding: var(--spacing-2xl) 0;
}

.booking-layout {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: var(--spacing-2xl);
    align-items: start;
}

.booking-main {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
}

.booking-header {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
}

.page-title {
    font-size: var(--font-size-3xl);
    font-weight: 700;
    margin: 0;
}

.movie-info-bar {
    padding: var(--spacing-lg);
    border-radius: var(--radius-xl);
}

.movie-info-content {
    display: flex;
    gap: var(--spacing-lg);
    align-items: center;
}

.movie-poster-small {
    width: 80px;
    height: 120px;
    object-fit: cover;
    border-radius: var(--radius-md);
}

.movie-details-small h3 {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
}

.movie-details-small p {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.showtime-info {
    color: var(--color-accent-primary);
    font-weight: 500;
}

.booking-sidebar {
    position: sticky;
    top: 100px;
}

.summary-card {
    padding: var(--spacing-xl);
    border-radius: var(--radius-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.summary-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    margin: 0;
    color: var(--color-text-primary);
}

.summary-subtitle {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
}

.summary-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding-bottom: var(--spacing-lg);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.summary-section:last-of-type {
    border-bottom: none;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.summary-label {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.summary-value {
    color: var(--color-text-primary);
    font-weight: 500;
    text-align: right;
}

.total-price {
    padding-top: var(--spacing-md);
    border-top: 2px solid rgba(168, 85, 247, 0.3);
}

.total-price .summary-label {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
}

.total-price .summary-value {
    font-size: var(--font-size-2xl);
    font-weight: 800;
}

.selected-seats-list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
}

.seat-tag {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: var(--gradient-primary);
    color: white;
    border-radius: var(--radius-md);
    font-size: var(--font-size-xs);
    font-weight: 600;
}

.booking-note {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    margin: 0;
    padding: var(--spacing-md);
    background: rgba(168, 85, 247, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
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

/* Responsive */
@media (max-width: 1200px) {
    .booking-layout {
        grid-template-columns: 1fr 350px;
    }
}

@media (max-width: 992px) {
    .booking-layout {
        grid-template-columns: 1fr;
    }

    .booking-sidebar {
        position: static;
    }
}

@media (max-width: 768px) {
    .page-title {
        font-size: var(--font-size-2xl);
    }

    .movie-info-content {
        flex-direction: column;
        text-align: center;
    }
}
</style>
