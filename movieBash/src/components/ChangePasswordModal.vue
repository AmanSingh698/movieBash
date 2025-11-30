<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content animate-scale-in">
      <button class="modal-close-btn" @click="$emit('close')">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <div class="modal-header">
        <h2 class="modal-title gradient-text">Change Password</h2>
        <p class="modal-subtitle">Enter your new password</p>
      </div>

      <form @submit.prevent="handleSubmit" class="password-form">
        <div class="form-group">
          <label for="newPassword" class="form-label">New Password</label>
          <div class="password-input-wrapper">
            <input
              :type="showNewPassword ? 'text' : 'password'"
              id="newPassword"
              v-model="formData.newPassword"
              class="form-input"
              placeholder="Enter new password"
              required
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showNewPassword = !showNewPassword"
            >
              <svg
                v-if="!showNewPassword"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                ></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="confirmPassword" class="form-label">Confirm New Password</label>
          <div class="password-input-wrapper">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              id="confirmPassword"
              v-model="formData.confirmPassword"
              class="form-input"
              placeholder="Confirm new password"
              required
              minlength="6"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <svg
                v-if="!showConfirmPassword"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <svg
                v-else
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                ></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg submit-btn" :disabled="isLoading">
          {{ isLoading ? 'Changing...' : 'Change Password' }}
        </button>

        <div
          v-if="message"
          :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']"
          role="alert"
        >
          {{ message }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/utils/axiosConfig'
import { useStore } from 'vuex'

const store = useStore()
const emit = defineEmits(['close'])

const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const message = ref('')
const messageType = ref('error')

const formData = reactive({
  newPassword: '',
  confirmPassword: '',
})

function showMessage(text, type = 'error', autoClear = true, ms = 4000) {
  message.value = text
  messageType.value = type
  if (autoClear) {
    setTimeout(() => {
      message.value = ''
    }, ms)
  }
}

const handleSubmit = async () => {
  message.value = ''

  if (formData.newPassword !== formData.confirmPassword) {
    showMessage('Passwords do not match!', 'error')
    return
  }

  if (formData.newPassword.length < 6) {
    showMessage('Password must be at least 6 characters long', 'error')
    return
  }

  isLoading.value = true

  try {
    const response = await api.put('/auth/change-password', { newPassword: formData.newPassword })

    showMessage('Password changed successfully!', 'success', true, 2000)
    formData.newPassword = ''
    formData.confirmPassword = ''

    setTimeout(() => {
      emit('close')
    }, 2000)
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.error ||
      err.message ||
      'Failed to change password'
    showMessage(msg, 'error')
    console.error('Change password error:', err)
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 1rem;
  overflow-y: auto;
}

.modal-content {
  background: var(--color-bg-secondary);
  width: 100%;
  max-width: 450px;
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-close-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: 50%;
  transition: all var(--transition-fast);
  z-index: 10;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
}

.modal-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  margin-bottom: var(--spacing-xs);
}

.modal-subtitle {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.form-label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-input {
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-size: var(--font-size-base);
  transition: all var(--transition-fast);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
  background: var(--color-bg-secondary);
}

.password-input-wrapper {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: var(--spacing-md);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
}

.toggle-password:hover {
  color: var(--color-text-primary);
}

.submit-btn {
  width: 100%;
  margin-top: var(--spacing-sm);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out;
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.alert {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 0.95rem;
  line-height: 1.2;
}

.alert-error {
  background: rgba(255, 80, 80, 0.12);
  color: #ff5a5a;
  border: 1px solid rgba(255, 80, 80, 0.2);
}

.alert-success {
  background: rgba(60, 180, 80, 0.09);
  color: #2e8b57;
  border: 1px solid rgba(60, 180, 80, 0.14);
}

@media (max-width: 576px) {
  .modal-content {
    padding: var(--spacing-xl);
  }

  .modal-title {
    font-size: var(--font-size-xl);
  }
}
</style>
