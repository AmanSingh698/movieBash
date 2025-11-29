import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import MovieDetails from '@/views/MovieDetails.vue'
import BookingPage from '@/views/BookingPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/movie/:id',
      name: 'movie-details',
      component: MovieDetails,
    },
    {
      path: '/booking/:id',
      name: 'booking',
      component: BookingPage,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

export default router
