<template>
    <div class="movie-details" v-if="movieDetails.title">
        <!-- Trailer Player (Replaces Header Area) -->
        <div v-if="isPlayingTrailer" class="trailer-hero-section">
            <div class="trailer-wrapper">
                <button class="close-trailer-btn" @click="closeTrailer">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <iframe :src="trailerEmbedUrl" frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen class="trailer-iframe">
                </iframe>
            </div>
        </div>

        <!-- Backdrop -->
        <div v-if="!isPlayingTrailer" class="movie-backdrop"
            :style="{ backgroundImage: `url(${movieDetails.backdrop_url})` }">
            <div class="backdrop-overlay"></div>
        </div>

        <!-- Movie Info -->
        <div class="container">
            <div v-if="!isPlayingTrailer" class="movie-header">
                <div class="movie-poster-large">
                    <img :src="movieDetails.poster_url" :alt="movieDetails.title" />
                </div>

                <div class="movie-info-main">
                    <h1 class="movie-title-large">{{ movieDetails.title }}</h1>

                    <div class="movie-meta-large">
                        <div class="rating-large">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                <polygon
                                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2">
                                </polygon>
                            </svg>
                            <span class="rating-value">{{ movieDetails.rating }}/10</span>
                        </div>
                        <span class="separator">•</span>
                        <span>{{ movieDetails.runtime_minutes }} mins</span>
                        <span class="separator">•</span>
                        <span>{{ formatReleaseDate(movieDetails.release_date) }}</span>
                    </div>

                    <div class="genre-tags-large">
                        <span v-for="genre in movieDetails.genres" :key="genre" class="badge badge-primary">
                            {{ genre }}
                        </span>
                    </div>

                    <p class="synopsis-large">{{ movieDetails.synopsis }}</p>

                    <div class="movie-details-grid">
                        <div class="detail-item">
                            <strong>Director:</strong> {{ movieDetails.directors.join(', ') }}
                        </div>
                        <div class="detail-item">
                            <strong>Cast:</strong> {{ movieDetails.cast.join(', ') }}
                        </div>
                        <div class="detail-item">
                            <strong>Languages:</strong> {{ movieDetails.languages.join(', ') }}
                        </div>
                        <div class="detail-item">
                            <strong>Formats:</strong> {{ movieDetails.formats.join(', ') }}
                        </div>
                    </div>

                    <div class="action-buttons">
                        <button class="btn btn-primary btn-lg" @click="scrollToShowtimes">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            Book Tickets
                        </button>
                        <button class="btn btn-ghost btn-lg" @click="playTrailer" v-if="movieDetails.trailer_link">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polygon points="10 8 16 12 10 16 10 8"></polygon>
                            </svg>
                            Watch Trailer
                        </button>
                    </div>
                </div>
            </div>

            <!-- Showtimes Section -->
            <section class="showtimes-section" ref="showtimesSection">
                <h2 class="section-title">Select Theater & Showtime</h2>

                <div v-if="groupedTheaters.length > 0" class="theaters-list">
                    <div v-for="theater in groupedTheaters" :key="theater.id" class="theater-card glass">
                        <div class="theater-info">
                            <h3 class="theater-name">{{ theater.name }}</h3>
                            <p class="theater-location">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                    stroke-width="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                {{ theater.location }}
                            </p>
                        </div>

                        <div class="showtimes-grid">
                            <button v-for="showtime in theater.showtimes" :key="showtime.show_id" class="showtime-btn"
                                @click="selectShowtime(theater, showtime)">
                                <div class="showtime-format">{{ showtime.format }} - {{ showtime.language }}</div>
                                <div class="showtime-time">{{ showtime.time }}</div>
                                <div class="showtime-price">{{ showtime.seat_class }}</div>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="no-shows">
                    <p>No showtimes available at the moment.</p>
                </div>
            </section>
        </div>
    </div>

    <div v-else class="loading-state">
        <div class="loader"></div>
        <p>Loading movie details...</p>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMoviesStore } from '@/store/modules/movies'
import { useBookingStore } from '@/store/modules/booking'
import api from '@/utils/axiosConfig'

const moviesStore = useMoviesStore()
const bookingStore = useBookingStore()
const router = useRouter()
const route = useRoute()

const movieId = route.params.id;
const movieDetails = ref({});
const showDetails = ref([]);
const showtimesSection = ref(null)
const isPlayingTrailer = ref(false)

// Convert YouTube URL to embed URL
const trailerEmbedUrl = computed(() => {
    if (!movieDetails.value.trailer_link) return '';

    const url = movieDetails.value.trailer_link;
    let videoId = '';

    // Extract video ID from various YouTube URL formats
    if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
    }

    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
});

// Group shows by theater
const groupedTheaters = computed(() => {
    const theaterMap = new Map();

    showDetails.value.forEach(show => {
        const theaterId = show.theatre.id;

        if (!theaterMap.has(theaterId)) {
            theaterMap.set(theaterId, {
                id: theaterId,
                name: show.theatre.name,
                location: `${show.theatre.city}, ${show.theatre.state}`,
                showtimes: []
            });
        }

        theaterMap.get(theaterId).showtimes.push({
            show_id: show.show_id,
            time: show.time,
            time_24: show.time_24,
            format: show.format,
            language: show.language,
            seat_class: show.seat_class,
            base_price: show.base_price,
            // min_price_class: show.min_price_class,
            seat_prices: show.seat_prices,
            screen: show.screen
        });
    });

    return Array.from(theaterMap.values());
});

// Format release date
const formatReleaseDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

const playTrailer = () => {
    isPlayingTrailer.value = true;
    // Scroll to top to ensure video is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const closeTrailer = () => {
    isPlayingTrailer.value = false;
}

const scrollToShowtimes = () => {
    showtimesSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const selectShowtime = (theater, showtime) => {
    // Initialize booking with selected show details
    bookingStore.initializeBooking({
        movie: movieDetails.value,
        theater: {
            id: theater.id,
            name: theater.name,
            location: theater.location
        },
        showtime: {
            show_id: showtime.show_id,
            time: showtime.time,
            format: showtime.format,
            language: showtime.language,
            screen: showtime.screen,
            seat_prices: showtime.seat_prices
        }
    })

    // Navigate to seat selection page
    router.push(`/booking/${movieDetails.value.id}/seats/${showtime.show_id}`)
}

const getMovieDetails = async () => {
    try {
        const response = await api.post(`/movies/details/${movieId}`)
        movieDetails.value = response.data.getMovieDetails;
        showDetails.value = response.data.showTimingAndDetails;
    } catch (error) {
        console.log(error)
    }
}

onMounted(() => {
    getMovieDetails();
})
</script>

<style scoped>
.movie-details {
    min-height: 100vh;
    position: relative;
}

/* Trailer Hero Section */
.trailer-hero-section {
    position: relative;
    width: 100%;
    height: 600px;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
}

.trailer-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
}

.trailer-iframe {
    width: 100%;
    height: 100%;
    border: none;
}

.close-trailer-btn {
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
    z-index: 20;
    transition: all 0.2s ease;
}

.close-trailer-btn:hover {
    background: rgba(255, 0, 0, 0.7);
    transform: scale(1.1);
}

.movie-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 600px;
    background-size: cover;
    background-position: center;
    z-index: 0;
}

.backdrop-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom,
            rgba(10, 14, 39, 0.7) 0%,
            rgba(10, 14, 39, 0.95) 70%,
            var(--color-bg-primary) 100%);
}

.movie-header {
    position: relative;
    z-index: 1;
    padding-top: var(--spacing-3xl);
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: var(--spacing-2xl);
    margin-bottom: var(--spacing-3xl);
}

.movie-poster-large {
    width: 100%;
    aspect-ratio: 2/3;
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-xl);
}

.movie-poster-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.movie-info-main {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.movie-title-large {
    font-size: var(--font-size-4xl);
    font-weight: 800;
    margin: 0;
    color: var(--color-text-primary);
}

.movie-meta-large {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
}

.rating-large {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: #fbbf24;
    font-weight: 700;
    font-size: var(--font-size-xl);
}

.separator {
    color: var(--color-text-muted);
}

.genre-tags-large {
    display: flex;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.synopsis-large {
    font-size: var(--font-size-lg);
    line-height: 1.8;
    color: var(--color-text-secondary);
    margin: 0;
}

.movie-details-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background: var(--color-bg-card);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(10px);
}

.detail-item {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
}

.detail-item strong {
    color: var(--color-text-primary);
    margin-right: var(--spacing-xs);
}

.action-buttons {
    display: flex;
    gap: var(--spacing-md);
}

.showtimes-section {
    position: relative;
    z-index: 1;
    padding: var(--spacing-2xl) 0;
}

.section-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-xl);
}

.theaters-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
}

.theater-card {
    padding: var(--spacing-xl);
    border-radius: var(--radius-xl);
}

.theater-info {
    margin-bottom: var(--spacing-lg);
}

.theater-name {
    font-size: var(--font-size-xl);
    font-weight: 600;
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
}

.theater-location {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin: 0;
}

.showtimes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: var(--spacing-md);
}

.showtime-btn {
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-base);
    text-align: center;
}

.showtime-btn:hover:not(:disabled) {
    background: var(--color-bg-card);
    border-color: var(--color-accent-primary);
    transform: translateY(-2px);
}

.showtime-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.showtime-format {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-xs);
    font-weight: 500;
}

.showtime-time {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
}

.showtime-price {
    font-size: var(--font-size-sm);
    color: var(--color-accent-primary);
    font-weight: 500;
}

.no-shows {
    text-align: center;
    padding: var(--spacing-3xl);
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
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
@media (max-width: 992px) {
    .movie-header {
        grid-template-columns: 250px 1fr;
        gap: var(--spacing-lg);
    }

    .movie-title-large {
        font-size: var(--font-size-3xl);
    }

    .movie-details-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .movie-header {
        grid-template-columns: 1fr;
        text-align: center;
    }

    .movie-poster-large {
        max-width: 300px;
        margin: 0 auto;
    }

    .movie-meta-large {
        justify-content: center;
        flex-wrap: wrap;
    }

    .genre-tags-large {
        justify-content: center;
    }

    .action-buttons {
        flex-direction: column;
    }

    .showtimes-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .trailer-hero-section {
        height: 400px;
    }
}
</style>
