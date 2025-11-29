<template>
    <section class="movie-grid-section">
        <div class="container">
            <div class="section-header flex-between">
                <h2 class="section-title">{{ title }}</h2>
                <router-link v-if="viewAllLink" :to="viewAllLink" class="view-all-link">
                    View All
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                </router-link>
            </div>

            <div class="movie-grid" :class="`grid-${columns}`">
                <MovieCard v-for="movie in movies" :key="movie.id" :movie="movie" />
            </div>

            <div v-if="movies.length === 0" class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                    <polyline points="17 2 12 7 7 2"></polyline>
                </svg>
                <p>No movies found</p>
            </div>
        </div>
    </section>
</template>

<script setup>
import MovieCard from './MovieCard.vue'

defineProps({
    title: {
        type: String,
        required: true
    },
    movies: {
        type: Array,
        required: true
    },
    columns: {
        type: Number,
        default: 5
    },
    viewAllLink: {
        type: String,
        default: ''
    }
})
</script>

<style scoped>
.movie-grid-section {
    padding: var(--spacing-2xl) 0;
}

.section-header {
    margin-bottom: var(--spacing-xl);
}

.section-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin: 0;
}

.view-all-link {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-accent-primary);
    font-weight: 600;
    transition: gap var(--transition-fast);
}

.view-all-link:hover {
    gap: var(--spacing-sm);
}

.movie-grid {
    display: grid;
    gap: var(--spacing-lg);
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-muted);
    text-align: center;
}

.empty-state svg {
    margin-bottom: var(--spacing-md);
    opacity: 0.5;
}

.empty-state p {
    font-size: var(--font-size-lg);
    margin: 0;
}
</style>
