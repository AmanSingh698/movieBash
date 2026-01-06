<template>
    <div class="hero-slider">
        <!-- Hero Video Player (Visible only in Video Mode) -->
        <div v-if="isVideoMode && currentMovie?.trailer_link" class="hero-video-container"
            :class="{ active: isVideoPlaying }">
            <video ref="heroVideo" class="hero-video" autoplay muted loop playsinline @play="onVideoPlay">
                <source :src="currentMovie.trailer_link" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
            <button class="close-video-btn" @click="closeHeroVideo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="video-controls">
                <button class="mute-btn" @click="toggleMute">
                    <svg v-if="isMuted" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                        <line x1="23" y1="9" x2="17" y2="15"></line>
                        <line x1="17" y1="9" x2="23" y2="15"></line>
                    </svg>
                    <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    </svg>
                </button>
            </div>
        </div>

        <!-- Swiper Slider -->
        <swiper :modules="modules" :slides-per-view="1" :space-between="0" :loop="true" :autoplay="swiperAutoplay"
            :pagination="{ clickable: true }" :navigation="true" class="swiper-container" @swiper="onSwiper"
            v-show="!isVideoPlaying">
            <swiper-slide v-for="movie in featuredMovies" :key="movie.id">
                <div class="hero-slide" :style="{ backgroundImage: `url(${movie.backdrop_url})` }">
                    <div class="hero-overlay"></div>
                    <div class="container">
                        <div class="hero-content animate-fade-in">
                            <div class="hero-badges">
                                <span class="badge badge-primary">Featured</span>
                                <span class="badge badge-secondary">{{
                                    movie.status === 'now_showing' ? 'Now Showing' : 'Coming Soon'
                                    }}</span>
                            </div>

                            <h1 class="hero-title">{{ movie.title }}</h1>

                            <div v-if="movie.status === 'now_showing'" class="hero-meta">
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
                                <span>{{ getMovieDuration(movie) }}</span>
                                <span>•</span>
                                <span>{{ getMovieGenres(movie) }}</span>
                            </div>

                            <p class="hero-synopsis">{{ movie.synopsis }}</p>

                            <div class="hero-actions">
                                <router-link v-if="movie.status === 'now_showing'"
                                    :to="{ name: 'movie-details', params: { id: movie.id } }"
                                    class="btn btn-primary btn-lg">
                                    Book Tickets
                                </router-link>
                                <button v-if="
                                    (movie.status === 'now_showing' || movie.status === 'coming_soon') &&
                                    movie.trailer_link
                                " class="btn btn-ghost btn-lg" @click="openHeroVideo(movie)">
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
import { onMounted, ref, computed } from 'vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import api from '@/utils/axiosConfig'

const modules = [Autoplay, Pagination, Navigation]
const featuredMovies = ref([])
const swiperInstance = ref(null)
const heroVideo = ref(null)
const isVideoMode = ref(false)
const isVideoPlaying = ref(false)
const isMuted = ref(true)
const currentMovie = ref(null)

// Swiper autoplay configuration
const swiperAutoplay = computed(() => {
    if (isVideoMode.value) {
        return false // Disable autoplay when video is playing
    }
    return { delay: 5000, disableOnInteraction: false }
})

const onSwiper = (swiper) => {
    swiperInstance.value = swiper
}

const getFeaturedMovies = async () => {
    try {
        const response = await api.post('/movies/heroSlider')
        featuredMovies.value = response.data.movies || []
    } catch (error) {
        console.error('Error fetching featured movies:', error)
        featuredMovies.value = []
    }
}

// Helper function to get genres for a specific movie
const getMovieGenres = (movie) => {
    // API returns genres as comma-separated string: "Action,Thriller"
    if (typeof movie.genres === 'string') {
        const genreArray = movie.genres.split(',').map((g) => g.trim())
        return genreArray.slice(0, 2).join(', ')
    }
    if (Array.isArray(movie.genre)) {
        return movie.genre.slice(0, 2).join(', ')
    }
    return ''
}

// Helper function to get duration for a specific movie
const getMovieDuration = (movie) => {
    // API returns runtime_minutes as number
    if (movie.runtime_minutes) {
        const hours = Math.floor(movie.runtime_minutes / 60)
        const minutes = movie.runtime_minutes % 60
        return `${hours}h ${minutes}m`
    }
    return movie.duration || ''
}

// Video control functions
const toggleMute = () => {
    if (heroVideo.value) {
        heroVideo.value.muted = !heroVideo.value.muted
        isMuted.value = heroVideo.value.muted
    }
}

const onVideoPlay = () => {
    isVideoPlaying.value = true
}

const closeHeroVideo = () => {
    isVideoMode.value = false
    isVideoPlaying.value = false
    currentMovie.value = null

    // Resume swiper autoplay
    if (swiperInstance.value && swiperInstance.value.autoplay) {
        swiperInstance.value.autoplay.start()
    }
}

const openHeroVideo = (movie) => {
    currentMovie.value = movie
    isVideoMode.value = true
    isVideoPlaying.value = false

    // Stop swiper autoplay
    if (swiperInstance.value && swiperInstance.value.autoplay) {
        swiperInstance.value.autoplay.stop()
    }
}

onMounted(async () => {
    await getFeaturedMovies()
})
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

/* Hero Video Player Styles */
.hero-video-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 600px;
    overflow: hidden;
    z-index: 100;
    background: black;
}

.hero-video {
    width: 100%;
    height: 100%;
    /* object-fit: cover; */
}

.video-controls {
    position: absolute;
    bottom: 40px;
    right: 40px;
    z-index: 110;
}

.mute-btn {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mute-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: scale(1.1);
}

.close-video-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    z-index: 110;
    transition: all 0.2s ease;
}

.close-video-btn:hover {
    background: rgba(255, 0, 0, 0.7);
    transform: scale(1.1);
}
</style>
