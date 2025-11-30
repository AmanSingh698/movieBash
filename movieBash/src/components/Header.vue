<template>
  <header class="header glass-strong">
    <div class="container">
      <div class="header-content flex-between">
        <!-- Logo -->
        <router-link to="/" class="logo">
          <h2 class="gradient-text">MovieBash</h2>
        </router-link>

        <!-- Desktop Navigation -->
        <nav class="nav-desktop">
          <router-link to="/" class="nav-link">Movies</router-link>
          <router-link to="/events" class="nav-link">Events</router-link>
          <router-link to="/plays" class="nav-link">Plays</router-link>
          <router-link to="/sports" class="nav-link">Sports</router-link>
          <router-link v-if="userToken" to="/profile" class="nav-link">Profile</router-link>
        </nav>

        <!-- Search Bar -->
        <div class="search-container">
          <input
            type="text"
            v-model="searchQuery"
            @input="handleSearch"
            placeholder="Search for movies..."
            class="search-input"
          />
          <svg
            class="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        <!-- Location & Sign In -->
        <div class="header-actions">
          <button class="btn btn-ghost btn-sm location-btn" @click="openLocationModal">
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
            {{ selectedCity }}
          </button>
          <router-link v-if="!userToken" to="/login" class="btn btn-primary btn-sm"
            >Sign In</router-link
          >
          <button v-else class="btn btn-primary btn-sm" @click="handleSignOut">Sign Out</button>
        </div>

        <!-- Mobile Menu Toggle -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu">
          <svg
            v-if="!mobileMenuOpen"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg
            v-else
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
      </div>

      <!-- Mobile Navigation -->
      <transition name="slide-down">
        <nav v-if="mobileMenuOpen" class="nav-mobile">
          <router-link to="/" class="nav-link-mobile" @click="closeMobileMenu">Movies</router-link>
          <router-link to="/events" class="nav-link-mobile" @click="closeMobileMenu"
            >Events</router-link
          >
          <router-link to="/plays" class="nav-link-mobile" @click="closeMobileMenu"
            >Plays</router-link
          >
          <router-link to="/sports" class="nav-link-mobile" @click="closeMobileMenu"
            >Sports</router-link
          >
          <router-link
            v-if="userToken"
            to="/profile"
            class="nav-link-mobile"
            @click="closeMobileMenu"
            >Profile</router-link
          >
          <div class="mobile-actions">
            <button class="btn btn-ghost btn-sm" @click="openLocationModal">
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
              {{ selectedCity }}
            </button>
            <router-link v-if="!userToken" to="/login" class="btn btn-primary btn-sm"
              >Sign In</router-link
            >
            <button v-else class="btn btn-primary btn-sm" @click="handleSignOut">Sign Out</button>
          </div>
        </nav>
      </transition>
    </div>
    <LocationModal
      v-if="showLocationModal"
      @close="showLocationModal = false"
      @select="handleCitySelect"
    />
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import LocationModal from './LocationModal.vue'

const store = useStore()
const router = useRouter()

const searchQuery = ref('')
const mobileMenuOpen = ref(false)
const showLocationModal = ref(false)
const selectedCity = ref('Mumbai')

// Computed property to reactively track token from Vuex store
const userToken = computed(() => store.getters['auth/authToken'])

const handleSearch = () => {
  store.dispatch('movies/searchMovies', searchQuery.value)
  if (searchQuery.value && router.currentRoute.value.path !== '/search') {
    router.push('/search')
  }
}

const openLocationModal = () => {
  showLocationModal.value = true
}

const handleSignOut = () => {
  store.dispatch('auth/logout')
  router.push('/')
}

const handleCitySelect = (city) => {
  selectedCity.value = city
}

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  padding: var(--spacing-md) 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  gap: var(--spacing-lg);
}

.logo h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.nav-desktop {
  display: flex;
  gap: var(--spacing-xl);
  align-items: center;
}

.nav-link {
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color var(--transition-fast);
  position: relative;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: var(--color-accent-primary);
}

.nav-link.router-link-active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  padding-left: var(--spacing-xl);
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-icon {
  position: absolute;
  left: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.location-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.mobile-menu-toggle {
  display: none;
  background: none;
  border: none;
  color: var(--color-text-primary);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.nav-mobile {
  display: none;
}

/* Mobile Styles */
@media (max-width: 992px) {
  .nav-desktop {
    display: none;
  }

  .search-container {
    max-width: 250px;
  }

  .mobile-menu-toggle {
    display: block;
  }

  .nav-mobile {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-lg) 0;
    margin-top: var(--spacing-md);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-link-mobile {
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-text-secondary);
    font-weight: 500;
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .nav-link-mobile:hover,
  .nav-link-mobile.router-link-active {
    background: var(--color-bg-tertiary);
    color: var(--color-accent-primary);
  }

  .mobile-actions {
    display: flex;
    gap: var(--spacing-md);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
}

@media (max-width: 768px) {
  .logo h2 {
    font-size: var(--font-size-xl);
  }

  .header {
    padding: var(--spacing-sm) 0;
  }

  .header-content {
    gap: var(--spacing-sm);
  }

  .search-container {
    order: 4;
    max-width: 100%;
    flex-basis: 100%;
    margin-top: var(--spacing-sm);
  }

  .header-actions {
    gap: var(--spacing-sm);
  }

  .location-btn {
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .location-btn svg {
    width: 14px;
    height: 14px;
  }
}

/* Transitions */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all var(--transition-base);
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
