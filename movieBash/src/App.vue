<script setup>
import { onMounted } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import { useAuthStore } from '@/store/modules/auth'

const authStore = useAuthStore()

// Fix #7: Restore session from httpOnly refresh cookie on every page load.
// This replaces the old pattern of reading the access token from localStorage.
onMounted(async () => {
  await authStore.initAuth()
})
</script>

<template>
  <div id="app">
    <Header />
    <main>
      <RouterView />
    </main>
    <Footer />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}
</style>
