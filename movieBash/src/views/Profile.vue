<template>
  <div class="profile-page">
    <div class="container">
      <div class="profile-header">
        <h1 class="page-title gradient-text">My Profile</h1>
        <p class="page-subtitle">Manage your account and view your bookings</p>
      </div>

      <div class="profile-content">
        <!-- User Info Card -->
        <div class="profile-card glass-strong">
          <div class="card-header">
            <div class="user-avatar">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="user-info">
              <h2 class="user-name">{{ user?.name || 'User' }}</h2>
              <p class="user-email">{{ user?.email || 'email@example.com' }}</p>
            </div>
          </div>

          <div class="card-divider"></div>

          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-icon">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                  <polyline points="17 2 12 7 7 2"></polyline>
                </svg>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ bookingsCount }}</span>
                <span class="stat-label">Total Bookings</span>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-icon">
                <svg
                  width="24"
                  height="24"
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
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ formatDate(user?.createdAt) }}</span>
                <span class="stat-label">Member Since</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Grid -->
        <div class="actions-grid">
          <button class="action-card glass" @click="showBookingsModal = true">
            <div class="action-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                <polyline points="17 2 12 7 7 2"></polyline>
              </svg>
            </div>
            <h3 class="action-title">View Bookings</h3>
            <p class="action-description">See all your movie ticket bookings</p>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </button>

          <button class="action-card glass" @click="showPasswordModal = true">
            <div class="action-icon">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 class="action-title">Change Password</h3>
            <p class="action-description">Update your account password</p>
            <div class="action-arrow">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <BookingsModal v-if="showBookingsModal" @close="showBookingsModal = false" />
    <ChangePasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import BookingsModal from '@/components/BookingsModal.vue'
import ChangePasswordModal from '@/components/ChangePasswordModal.vue'

const store = useStore()
const router = useRouter()

const showBookingsModal = ref(false)
const showPasswordModal = ref(false)
const bookingsCount = ref(0)

const user = computed(() => store.getters['auth/currentUser'])
const token = computed(() => store.getters['auth/authToken'])

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  })
}

onMounted(() => {
  // Redirect to login if not authenticated
  if (!token.value) {
    router.push('/login')
  }

  // TODO: Fetch bookings count from API
  bookingsCount.value = 0
})
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: var(--spacing-2xl) 0;
  background: var(--color-bg-primary);
}

.profile-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: var(--font-size-3xl);
  font-weight: 800;
  margin-bottom: var(--spacing-xs);
}

.page-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.profile-content {
  display: grid;
  gap: var(--spacing-xl);
}

.profile-card {
  padding: var(--spacing-2xl);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.user-email {
  color: var(--color-text-muted);
  font-size: var(--font-size-base);
}

.card-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: var(--spacing-xl) 0;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.03);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: rgba(168, 85, 247, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-primary);
  flex-shrink: 0;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-text-primary);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.action-card {
  position: relative;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-base);
  overflow: hidden;
}

.action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--gradient-primary);
  transform: scaleX(0);
  transition: transform var(--transition-base);
}

.action-card:hover {
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
}

.action-card:hover::before {
  transform: scaleX(1);
}

.action-card:hover .action-arrow {
  transform: translateX(4px);
}

.action-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-md);
  background: rgba(168, 85, 247, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-primary);
  margin-bottom: var(--spacing-md);
}

.action-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
  color: var(--color-text-primary);
}

.action-description {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-md);
}

.action-arrow {
  color: var(--color-accent-primary);
  transition: transform var(--transition-fast);
}

@media (max-width: 768px) {
  .profile-page {
    padding: var(--spacing-xl) 0;
  }

  .page-title {
    font-size: var(--font-size-2xl);
  }

  .card-header {
    flex-direction: column;
    text-align: center;
  }

  .user-avatar {
    width: 64px;
    height: 64px;
  }

  .user-name {
    font-size: var(--font-size-xl);
  }

  .profile-stats {
    grid-template-columns: 1fr;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }

  .profile-card {
    padding: var(--spacing-xl);
  }
}
</style>
