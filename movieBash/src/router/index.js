import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import MovieDetails from '@/views/MovieDetails.vue'
import BookingPage from '@/views/BookingPage.vue'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Profile from '@/views/Profile.vue'

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
    // Fix: /booking/confirmation MUST come before /booking/:id.
    // Vue Router matches top-to-bottom; if /:id is first, the string
    // "confirmation" is treated as an id param and the confirmation
    // route is never reached.
    {
      path: '/booking/confirmation',
      name: 'booking-confirmation',
      component: () => import('@/views/BookingConfirmation.vue'),
    },
    {
      path: '/booking/:id',
      name: 'booking',
      component: BookingPage,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/profile',
      name: 'profile',
      component: Profile,
    },
    // 404 catch-all
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: Home,
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
