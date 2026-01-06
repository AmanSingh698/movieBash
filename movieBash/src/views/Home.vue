<template>
    <div class="home-page">
        <HeroSlider />

        <MovieGrid title="Now Showing" :movies="nowShowing" :columns="5" view-all-link="/now-showing" />

        <MovieGrid title="Coming Soon" :movies="comingSoon" :columns="5" view-all-link="/coming-soon" />
    </div>
</template>

<script setup>
import HeroSlider from '@/components/HeroSlider.vue'
import MovieGrid from '@/components/MovieGrid.vue'
import { ref, onMounted } from 'vue'
import api from '@/utils/axiosConfig'

const nowShowing = ref([]);
const comingSoon = ref([]);

const getShowingMovies = async () => {
    try {
        const response = await api.post("movies/nowShowing");
        console.log('API Response:', response.data);
        // The API returns { message: "...", movies: [...] }
        // So we access response.data.movies
        nowShowing.value = response.data.movies || [];
    } catch (err) {
        console.error('Error fetching movies:', err);
        nowShowing.value = [];
    }
}

const getUpcomingMovies = async () => {
    try {
        const response = await api.post("movies/comingSoon");
        console.log('API Response:', response.data);
        // The API returns { message: "...", movies: [...] }
        // So we access response.data.movies
        comingSoon.value = response.data.movies || [];
    } catch (err) {
        console.error('Error fetching movies:', err);
        comingSoon.value = [];
    }
}

onMounted(async () => {
    await getShowingMovies();
    await getUpcomingMovies();
})
</script>

<style scoped>
.home-page {
    min-height: 100vh;
}
</style>
