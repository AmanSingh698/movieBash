<template>
    <div class="movie-card card glass card-hover" @click="handleClick">
        <div class="movie-poster-container">
            <img :src="movie.poster" :alt="movie.title" class="movie-poster" />
            <div class="movie-overlay">
                <button class="btn btn-primary btn-sm">Book Now</button>
            </div>
            <div class="rating-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon
                        points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                    </polygon>
                </svg>
                {{ movie.rating }}
            </div>
            <div class="format-badges">
                <span v-for="format in movie.format" :key="format" class="badge-mini">{{ format }}</span>
            </div>
        </div>

        <div class="movie-info">
            <h3 class="movie-title">{{ movie.title }}</h3>
            <div class="movie-subtext">
                <span class="genre-text">{{ movie.genre.slice(0, 2).join(', ') }}</span>
                <span class="dot">•</span>
                <span>{{ movie.duration }}</span>
            </div>
            <div class="movie-lang">{{ movie.language.join(', ') }}</div>
        </div>
    </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
    movie: {
        type: Object,
        required: true
    }
})

const router = useRouter()

const handleClick = () => {
    router.push(`/movie/${props.movie.id}`)
}
</script>

<style scoped>
.movie-card {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
    background: transparent;
    border: none;
}

.movie-poster-container {
    position: relative;
    width: 100%;
    aspect-ratio: 2/3;
    overflow: hidden;
    border-radius: var(--radius-lg);
    margin-bottom: var(--spacing-sm);
}

.movie-poster {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);
}

.movie-card:hover .movie-poster {
    transform: scale(1.05);
}

.movie-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity var(--transition-base);
}

.movie-card:hover .movie-overlay {
    opacity: 1;
}

.rating-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #fbbf24;
}

.format-badges {
    position: absolute;
    bottom: 8px;
    left: 8px;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.badge-mini {
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
}

.movie-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 4px;
}

.movie-title {
    font-size: var(--font-size-base);
    font-weight: 600;
    margin: 0;
    color: var(--color-text-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.movie-subtext {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--color-text-secondary);
}

.genre-text {
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 120px;
}

.dot {
    color: var(--color-text-muted);
    font-size: 8px;
}

.movie-lang {
    font-size: 12px;
    color: var(--color-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (max-width: 576px) {
    .movie-title {
        font-size: 15px;
    }

    .movie-subtext {
        font-size: 12px;
    }
}
</style>
