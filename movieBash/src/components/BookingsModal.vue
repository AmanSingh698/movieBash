<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content animate-scale-in">
      <button class="modal-close-btn" @click="$emit('close')">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="modal-header">
        <h2 class="modal-title gradient-text">My Bookings</h2>
        <p class="modal-subtitle">View your movie ticket bookings</p>
      </div>

      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading bookings...</p>
      </div>

      <div v-else-if="bookings.length === 0" class="empty-state">
        <svg
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
          <polyline points="17 2 12 7 7 2"></polyline>
        </svg>
        <h3>No Bookings Yet</h3>
        <p>You haven't made any movie bookings yet.</p>
      </div>

      <div v-else class="bookings-list">
        <div v-for="booking in bookings" :key="booking.id" class="booking-card">
          <div class="booking-header">
            <h3 class="movie-title">{{ booking.movieTitle }}</h3>
            <span :class="['booking-status', `status-${booking.status}`]">
              {{ booking.status }}
            </span>
          </div>

          <div class="booking-details">
            <div class="detail-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>{{ formatDate(booking.bookingDate) }}</span>
            </div>

            <div class="detail-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{{ booking.showTime }}</span>
            </div>

            <div class="detail-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{{ booking.theater }}</span>
            </div>

            <div class="detail-item">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="17 2 12 7 7 2"></polyline>
              </svg>
              <span>Seats: {{ booking.seats.join(', ') }}</span>
            </div>
          </div>

          <div class="booking-footer">
            <span class="booking-id">Booking ID: {{ booking.id }}</span>
            <span class="booking-total">₹{{ booking.totalAmount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/utils/axiosConfig'
import { useStore } from 'vuex'

const store = useStore()
const emit = defineEmits(['close'])

const bookings = ref([])
const isLoading = ref(true)

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const fetchBookings = async () => {
  isLoading.value = true
  try {
    const response = await api.get('/bookings')
    bookings.value = response.data.bookings || []
  } catch (err) {
    console.error('Error fetching bookings:', err)
    bookings.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchBookings()
})
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background: var(--color-bg-secondary);
  width: 100%;
  max-width: 700px;
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: 50%;
  transition: all var(--transition-fast);
  z-index: 10;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

.modal-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.modal-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto var(--spacing-md);
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-accent-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-state {
  text-align: center;
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

.empty-state svg {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state h3 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-secondary);
}

.bookings-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.booking-card {
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all var(--transition-fast);
}

.booking-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-md);
  gap: var(--spacing-md);
}

.movie-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.booking-status {
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
}

.status-confirmed {
  background: rgba(60, 180, 80, 0.15);
  color: #3cb450;
}

.status-pending {
  background: rgba(255, 193, 7, 0.15);
  color: #ffc107;
}

.status-cancelled {
  background: rgba(255, 80, 80, 0.15);
  color: #ff5050;
}

.booking-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.detail-item svg {
  color: var(--color-accent-primary);
  flex-shrink: 0;
}

.booking-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.booking-id {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.booking-total {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-accent-primary);
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (max-width: 576px) {
  .modal-content {
    padding: var(--spacing-xl);
  }

  .modal-title {
    font-size: var(--font-size-xl);
  }

  .booking-details {
    grid-template-columns: 1fr;
  }

  .booking-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
