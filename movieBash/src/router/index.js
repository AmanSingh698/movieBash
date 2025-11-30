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
