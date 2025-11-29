<template>
    <div class="home-page">
        <HeroSlider />

        <MovieGrid title="Now Showing" :movies="nowShowingMovies" :columns="5" view-all-link="/now-showing" />

        <MovieGrid title="Coming Soon" :movies="comingSoonMovies" :columns="5" view-all-link="/coming-soon" />
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import HeroSlider from '@/components/HeroSlider.vue'
import MovieGrid from '@/components/MovieGrid.vue'

const store = useStore()

const nowShowingMovies = computed(() => store.getters['movies/nowShowingMovies'])
const comingSoonMovies = computed(() => store.getters['movies/comingSoonMovies'])
</script>

<style scoped>
.home-page {
    min-height: 100vh;
}
</style>
