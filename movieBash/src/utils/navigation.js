// src/utils/navigation.js
let _router = null

export function initRouter(router) {
  _router = router
}

export function goToLogin() {
  if (_router) {
    _router.push({ name: 'login' })
  } else {
    // fallback for environments where router isn't initialized
    window.location.href = '/login'
  }
}
