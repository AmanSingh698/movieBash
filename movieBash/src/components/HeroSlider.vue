<template>
    <div class="hero-slider">
        <swiper :modules="modules" :slides-per-view="1" :space-between="0" :loop="true"
            :autoplay="{ delay: 5000, disableOnInteraction: false }" :pagination="{ clickable: true }"
            :navigation="true" class="swiper-container">
            <swiper-slide v-for="movie in featuredMovies" :key="movie.id">
                <div class="hero-slide" :style="{ backgroundImage: `url(${movie.backdrop})` }">
                    <div class="hero-overlay"></div>
                    <div class="container">
                        <div class="hero-content animate-fade-in">
                            <div class="hero-badges">
                                <span class="badge badge-primary">Featured</span>
                                <span class="badge badge-secondary">{{ movie.status === 'now-showing' ? 'Now Showing' :
                                    'Coming Soon' }}</span>
                            </div>

                            <h1 class="hero-title">{{ movie.title }}</h1>

                            <div class="hero-meta">
                                <div class="rating">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
                                        class="text-warning">
                                        <path
                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z">
                                        </path>
                                    </svg>
                                    <span>{{ movie.rating }}/10</span>
                                </div>
                                <span>•</span>
                                <span>{{ movie.duration }}</span>
                                <span>•</span>
                                <span>{{ movie.genre ? movie.genre.join(', ') : '' }}</span>
                            </div>

                            <p class="hero-synopsis">{{ movie.synopsis }}</p>

                            <div class="hero-actions">
                                <router-link :to="{ name: 'movie-details', params: { id: movie.id } }"
                                    class="btn btn-primary btn-lg">
                                    Book Tickets
                                </router-link>
                                <button class="btn btn-ghost btn-lg">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                        stroke-width="2" class="mr-2">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polygon points="10 8 16 12 10 16 10 8"></polygon>
                                    </svg>
                                    Watch Trailer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </swiper-slide>
        </swiper>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const store = useStore()
const modules = [Autoplay, Pagination, Navigation]

const featuredMovies = computed(() => store.getters['movies/featuredMovies'])
</script>

<style scoped>
.hero-slider {
    width: 100%;
    height: 600px;
    position: relative;
    margin-bottom: var(--spacing-3xl);
}

.swiper-container {
    width: 100%;
    height: 100%;
}

.hero-slide {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: top center;
    position: relative;
    display: flex;
    align-items: center;
}

.hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to right,
            rgba(10, 14, 39, 0.95) 0%,
            rgba(10, 14, 39, 0.7) 50%,
            rgba(10, 14, 39, 0.3) 100%);
}

.hero-content {
    position: relative;
    z-index: 10;
    max-width: 600px;
    color: white;
}

.hero-badges {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
}

.hero-title {
    font-size: var(--font-size-4xl);
    font-weight: 800;
    margin-bottom: var(--spacing-md);
    line-height: 1.1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-meta {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    margin-bottom: var(--spacing-lg);
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
}

.rating {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-warning);
    font-weight: 600;
}

.hero-synopsis {
    font-size: var(--font-size-lg);
    line-height: 1.6;
    margin-bottom: var(--spacing-xl);
    color: var(--color-text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.hero-actions {
    display: flex;
    gap: var(--spacing-md);
}

.mr-2 {
    margin-right: var(--spacing-sm);
}

/* Swiper Customization */
:deep(.swiper-pagination-bullet) {
    background: white;
    opacity: 0.5;
}

:deep(.swiper-pagination-bullet-active) {
    background: var(--color-accent-primary);
    opacity: 1;
}

:deep(.swiper-button-prev),
:deep(.swiper-button-next) {
    color: white;
    opacity: 0.5;
    transition: opacity var(--transition-fast);
}

:deep(.swiper-button-prev:hover),
:deep(.swiper-button-next:hover) {
    opacity: 1;
}

/* Responsive */
@media (max-width: 768px) {
    .hero-slider {
        height: 500px;
    }

    .hero-slide {
        background-position: center top;
        align-items: flex-end;
        padding-bottom: var(--spacing-xl);
    }

    .hero-overlay {
        background: linear-gradient(to top,
                rgba(10, 14, 39, 0.98) 0%,
                rgba(10, 14, 39, 0.95) 40%,
                rgba(10, 14, 39, 0.7) 70%,
                rgba(10, 14, 39, 0.3) 100%);
    }

    .hero-content {
        max-width: 100%;
    }

    .hero-title {
        font-size: var(--font-size-xl);
    }

    .hero-synopsis {
        font-size: var(--font-size-sm);
        -webkit-line-clamp: 2;
        line-clamp: 2;
    }

    .hero-actions {
        flex-direction: row;
        gap: var(--spacing-sm);
    }

    .hero-actions .btn {
        padding: var(--spacing-sm) var(--spacing-md);
        font-size: var(--font-size-sm);
    }

    :deep(.swiper-button-prev),
    :deep(.swiper-button-next) {
        display: none;
    }
}

@media (max-width: 576px) {
    .hero-slider {
        height: 450px;
    }

    .hero-title {
        font-size: var(--font-size-lg);
    }

    .hero-meta {
        flex-wrap: wrap;
        font-size: var(--font-size-xs);
        gap: var(--spacing-sm);
    }

    .hero-synopsis {
        display: none;
    }

    .hero-badges {
        flex-wrap: wrap;
    }

    .hero-actions {
        flex-direction: column;
        width: 100%;
    }

    .hero-actions .btn {
        width: 100%;
        justify-content: center;
    }
}
</style>
