<template>
    <div class="confirmation-page">
        <div v-if="loading" class="loading-spinner">
            <div class="spinner"></div>
        </div>
        <div v-else class="confirmation-card glass animate-scale-in">
            <!-- Success State -->
            <div v-if="isSuccess" class="status-content">
                <div class="icon-wrapper success">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h1 class="status-title gradient-text">Booking Confirmed!</h1>
                <p class="status-message">Your tickets have been successfully booked.</p>

                <div class="booking-details">
                    <div class="detail-row">
                        <span class="label">Booking ID</span>
                        <span class="value highlight">{{ bookingId }}</span>
                    </div>
                    <div class="detail-row" v-if="paymentId">
                        <span class="label">Payment ID</span>
                        <span class="value">{{ paymentId }}</span>
                    </div>

                    <div class="divider"></div>

                    <!-- Movie Details -->
                    <div class="movie-summary" v-if="movieTitle">
                        <h3>{{ movieTitle }}</h3>
                        <p>{{ theaterName }} | {{ showTime }}</p>
                        <p class="seats-text">Seats: {{ seats }}</p>
                    </div>

                    <div class="total-amount">
                        <span>Total Amount</span>
                        <span class="amount">₹{{ amount }}</span>
                    </div>
                </div>

                <div class="actions">
                    <button class="btn btn-primary btn-lg" @click="downloadTicket">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                        Download Ticket
                    </button>
                    <button class="btn btn-secondary" @click="goHome">Go to Home</button>
                </div>
            </div>

            <!-- Failed State -->
            <div v-else class="status-content">
                <div class="icon-wrapper error">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h1 class="status-title error-text">Booking Failed</h1>
                <p class="status-message">{{ displayMessage }}</p>

                <div class="actions">
                    <button class="btn btn-primary btn-lg" @click="retryBooking">Try Again</button>
                    <button class="btn btn-secondary" @click="goHome">Go to Home</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/axiosConfig'
import { jsPDF } from "jspdf"
import QRCode from "qrcode"
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const bookingDetails = ref(null)
const error = ref(null)

// Initial status from query (fallback)
const queryStatus = computed(() => route.query.status)
const queryMessage = computed(() => route.query.message)

// Computed properties for display
const isSuccess = computed(() => {
    if (bookingDetails.value) {
        return bookingDetails.value.status === 'confirmed'
    }
    return queryStatus.value === 'success'
})

const displayMessage = computed(() => {
    if (error.value) return error.value
    if (queryStatus.value === 'failed') return queryMessage.value
    return 'Something went wrong with your booking.'
})

const bookingId = computed(() => bookingDetails.value?.id || route.query.bookingId)
const paymentId = computed(() => route.query.paymentId)
const amount = computed(() => bookingDetails.value?.total_amount || route.query.amount)
const movieTitle = computed(() => bookingDetails.value?.movie_title || route.query.movie)
const theaterName = computed(() => bookingDetails.value?.theatre_name || route.query.theater)
const showTime = computed(() => {
    if (bookingDetails.value?.start_time) {
        return new Date(bookingDetails.value.start_time).toLocaleString()
    }
    return route.query.time
})
const seats = computed(() => {
    if (bookingDetails.value?.items) {
        return bookingDetails.value.items.map(i => i.seat_label).join(', ')
    }
    return route.query.seats
})

onMounted(async () => {
    const id = route.query.bookingId
    if (id) {
        try {
            const res = await api.get(`/bookings/${id}`)
            if (res.data.success) {
                bookingDetails.value = res.data.data
            }
        } catch (err) {
            console.error('Error fetching booking:', err)
            if (err.response && err.response.status === 404) {
                error.value = 'Booking not found.'
            }
        }
    }
    loading.value = false
})

const downloadTicket = async () => {
    try {
        const doc = new jsPDF()

        // Header Gradient-like background
        doc.setFillColor(20, 20, 20) // Dark background
        doc.rect(0, 0, 210, 297, "F")

        // Ticket Container
        doc.setFillColor(30, 30, 30)
        doc.roundedRect(15, 20, 180, 240, 5, 5, "F")
        doc.setDrawColor(255, 255, 255)
        doc.setLineWidth(0.5)
        doc.roundedRect(15, 20, 180, 240, 5, 5, "S")

        // Title
        doc.setTextColor(168, 85, 247) // Purple accent
        doc.setFontSize(24)
        doc.setFont("helvetica", "bold")
        doc.text("MovieBash Ticket", 105, 40, { align: "center" })

        // Movie Title
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(22)
        doc.text(movieTitle.value || 'Movie Title', 105, 60, { align: "center" })

        // Divider
        doc.setDrawColor(100, 100, 100)
        doc.line(30, 70, 180, 70)

        // Details Section
        doc.setFontSize(12)
        doc.setTextColor(200, 200, 200)

        const leftCol = 30
        const rightCol = 120
        let y = 90
        const gap = 20

        // Row 1
        doc.setFont("helvetica", "bold")
        doc.text("Date & Time", leftCol, y)
        doc.text("Theater", rightCol, y)

        y += 8
        doc.setFont("helvetica", "normal")
        doc.setTextColor(255, 255, 255)
        // Format time properly if it's a date string
        const formattedTime = showTime.value
        doc.text(formattedTime, leftCol, y)
        doc.text(formattedTime, leftCol, y + 6) // Time below date if needed, simplifying here
        doc.text(theaterName.value || 'Theater Name', rightCol, y)

        y += gap + 5

        // Row 2
        doc.setTextColor(200, 200, 200)
        doc.setFont("helvetica", "bold")
        doc.text("Seats", leftCol, y)
        doc.text("Booking ID", rightCol, y)

        y += 8
        doc.setFont("helvetica", "normal")
        doc.setTextColor(255, 255, 255)
        doc.text(seats.value || 'Seats', leftCol, y)
        doc.text(String(bookingId.value), rightCol, y)

        y += gap

        // Row 3
        doc.setTextColor(200, 200, 200)
        doc.setFont("helvetica", "bold")
        doc.text("Total Amount", leftCol, y)
        // doc.text("Booked By", rightCol, y)

        y += 8
        doc.setTextColor(60, 180, 80) // Green price
        doc.setFont("helvetica", "normal")

        // Amount
        doc.setFontSize(16)
        doc.text(`Rs. ${amount.value}`, leftCol, y)

        // QR Code
        const qrData = JSON.stringify({
            id: bookingId.value,
            movie: movieTitle.value,
            seats: seats.value,
            amount: amount.value
        })

        const qrDataUrl = await QRCode.toDataURL(qrData, { width: 200, margin: 1 })
        doc.addImage(qrDataUrl, "PNG", 65, 170, 80, 80)

        doc.setFontSize(10)
        doc.setTextColor(150, 150, 150)
        doc.text("Scan to verify details", 105, 260, { align: "center" })

        doc.save(`ticket-${bookingId.value}.pdf`)
    } catch (err) {
        console.error('Error generating ticket:', err)
        alert('Failed to download ticket. Please try again.')
    }
}

const goHome = () => {
    router.push('/')
}

const retryBooking = () => {
    router.back()
}
</script>

<style scoped>
.confirmation-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    background-image:
        radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 40%);
}

.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(168, 85, 247, 0.2);
    border-top-color: #a855f7;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.confirmation-card {
    width: 100%;
    max-width: 500px;
    padding: var(--spacing-2xl);
    border-radius: var(--radius-xl);
    text-align: center;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-lg);
}

.icon-wrapper {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md);
}

.icon-wrapper.success {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border: 2px solid rgba(34, 197, 94, 0.2);
}

.icon-wrapper.error {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
    border: 2px solid rgba(239, 68, 68, 0.2);
}

.status-title {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    margin: 0;
}

.error-text {
    color: #ef4444;
}

.status-message {
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
    margin: 0;
}

.booking-details {
    width: 100%;
    background: var(--color-bg-tertiary);
    padding: var(--spacing-xl);
    border-radius: var(--radius-lg);
    margin: var(--spacing-lg) 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.label {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.value {
    color: var(--color-text-primary);
    font-weight: 600;
    font-family: monospace;
    font-size: var(--font-size-md);
}

.highlight {
    color: var(--color-accent-primary);
}

.divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: var(--spacing-xs) 0;
}

.movie-summary h3 {
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
}

.movie-summary p {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.seats-text {
    color: var(--color-accent-secondary) !important;
    font-weight: 600;
    margin-top: var(--spacing-xs);
}

.total-amount {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: var(--spacing-xs);
    padding-top: var(--spacing-md);
    border-top: 1px dashed rgba(255, 255, 255, 0.2);
}

.total-amount .amount {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--color-accent-primary);
}

.actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    width: 100%;
}

.btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
}

.animate-scale-in {
    animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(20px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@media (max-width: 576px) {
    .confirmation-card {
        padding: var(--spacing-xl);
    }

    .status-title {
        font-size: var(--font-size-2xl);
    }
}
</style>
