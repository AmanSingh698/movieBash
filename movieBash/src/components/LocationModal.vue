<template>
    <div class="modal-overlay" @click.self="$emit('close')">
        <div class="modal-content animate-scale-in">
            <button class="close-btn" @click="$emit('close')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div class="modal-header">
                <div class="search-container">
                    <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" placeholder="Search for your city" class="search-input" v-model="searchQuery" />
                </div>
            </div>

            <div class="detect-location" @click="detectLocation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    class="detect-icon">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 2v20M2 12h20"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <span>Detect my location</span>
            </div>

            <div class="popular-cities">
                <h3 class="section-title" v-if="!searchQuery">Popular Cities</h3>
                <h3 class="section-title" v-else>Search Results</h3>

                <div class="cities-grid" v-if="displayedCities.length > 0">
                    <div v-for="city in displayedCities" :key="city.name" class="city-item"
                        @click="selectCity(city.name)">
                        <div class="city-icon">
                            <!-- Placeholder for city landmark icons -->
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="1.5">
                                <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a4 4 0 0 1 4-4 4 4 0 0 1 4 4v9"></path>
                            </svg>
                        </div>
                        <span class="city-name">{{ city.name }}</span>
                    </div>
                </div>

                <div v-else class="no-results">
                    <p>No cities found matching "{{ searchQuery }}"</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'select'])

const searchQuery = ref('')

const popularCities = [
    { name: 'Mumbai' },
    { name: 'Delhi-NCR' },
    { name: 'Bengaluru' },
    { name: 'Hyderabad' },
    { name: 'Chandigarh' },
    { name: 'Ahmedabad' },
    { name: 'Pune' },
    { name: 'Chennai' },
    { name: 'Kolkata' },
    { name: 'Kochi' },
]

const detectLocation = () => {
    // Mock detection
    selectCity('Mumbai')
}

const selectCity = (city) => {
    emit('select', city)
    emit('close')
}

const displayedCities = computed(() => {
    if (!searchQuery.value) return popularCities
    return popularCities.filter(c => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})
</script>

<style scoped>
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding-top: 100px;
    z-index: 1000;
}

.modal-content {
    background: var(--color-bg-secondary);
    width: 100%;
    max-width: 800px;
    border-radius: var(--radius-lg);
    padding: var(--spacing-xl);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.1);
    position: relative;
}

.close-btn {
    position: absolute;
    top: 0px;
    right: 0px;
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--spacing-xs);
    border-radius: 50%;
    transition: all var(--transition-fast);
    z-index: 10;
}

.close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
}

.search-container {
    position: relative;
    margin-bottom: var(--spacing-md);
}

.search-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-md) var(--spacing-md) var(--spacing-3xl);
    background: var(--color-background);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: var(--font-size-md);
}

.search-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.search-icon {
    position: absolute;
    left: var(--spacing-md);
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-text-muted);
}

.detect-location {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-accent-primary);
    cursor: pointer;
    margin-bottom: var(--spacing-xl);
    font-weight: 500;
}

.detect-icon {
    color: var(--color-accent-primary);
}

.section-title {
    text-align: center;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-sm);
    text-transform: uppercase;
    letter-spacing: 1px;
}

.cities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: var(--spacing-lg);
    text-align: center;
}

.city-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    transition: transform var(--transition-fast);
}

.city-item:hover {
    transform: translateY(-5px);
}

.city-item:hover .city-name {
    color: var(--color-primary);
}

.city-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary);
}

.city-name {
    font-size: var(--font-size-sm);
    color: var(--color-text-primary);
}

.no-results {
    text-align: center;
    color: var(--color-text-muted);
    padding: var(--spacing-xl);
}

/* Animation */
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
</style>
