<template>
    <div class="auth-modal-overlay" @click.self="$emit('close')">
        <div class="auth-modal-content animate-scale-in">
            <button class="auth-close-btn" @click="$emit('close')">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>

            <div class="auth-header">
                <h2 class="auth-title gradient-text">{{ isLogin ? 'Welcome Back' : 'Create Account' }}</h2>
                <p class="auth-subtitle">{{ isLogin ? 'Sign in to continue' : 'Join MovieBash today' }}</p>
            </div>

            <form @submit.prevent="handleSubmit" class="auth-form">
                <div class="form-group" v-if="!isLogin">
                    <label for="name" class="form-label">Full Name</label>
                    <input type="text" id="name" v-model="formData.name" class="form-input"
                        placeholder="Enter your full name" required />
                </div>

                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" id="email" v-model="formData.email" class="form-input"
                        placeholder="Enter your email" required />
                </div>

                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <div class="password-input-wrapper">
                        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="formData.password"
                            class="form-input" placeholder="Enter your password" required />
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                            <svg v-if="!showPassword" width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                stroke-width="2">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24">
                                </path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="form-group" v-if="!isLogin">
                    <label for="confirmPassword" class="form-label">Confirm Password</label>
                    <input type="password" id="confirmPassword" v-model="formData.confirmPassword" class="form-input"
                        placeholder="Confirm your password" required />
                </div>

                <div class="form-actions" v-if="isLogin">
                    <a href="#" class="forgot-password">Forgot Password?</a>
                </div>

                <button type="submit" class="btn btn-primary btn-lg submit-btn">
                    {{ isLogin ? 'Sign In' : 'Create Account' }}
                </button>

                <div v-if="serverMessage" :class="['alert', serverType === 'error' ? 'alert-error' : 'alert-success']"
                    role="alert">
                    {{ serverMessage }}
                </div>
            </form>

            <div class="auth-divider">
                <span>or continue with</span>
            </div>

            <div class="social-login">
                <button class="social-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4" />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853" />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05" />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335" />
                    </svg>
                    Google
                </button>
                <button class="social-btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                            fill="#1877F2" />
                    </svg>
                    Facebook
                </button>
            </div>

            <div class="auth-footer">
                <p>
                    {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
                    <a href="#" @click.prevent="toggleMode" class="toggle-link">
                        {{ isLogin ? 'Sign Up' : 'Sign In' }}
                    </a>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

const router = useRouter()
const store = useStore()
const props = defineProps({
    initialMode: {
        type: String,
        default: 'login'
    }
})

const emit = defineEmits(['close', 'login', 'signup'])

const isLogin = ref(props.initialMode === 'login')
const showPassword = ref(false)

const formData = reactive({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
})

const serverMessage = ref('')
const serverType = ref('error')

function showMessage(text, type = 'error', autoClear = true, ms = 4000) {
    serverMessage.value = text
    serverType.value = type
    if (autoClear) {
        setTimeout(() => {
            serverMessage.value = ''
        }, ms)
    }
}

const toggleMode = () => {
    isLogin.value = !isLogin.value
    formData.name = ''
    formData.email = ''
    formData.password = ''
    formData.confirmPassword = ''
    serverMessage.value = ''
}

const handleSubmit = async () => {
    serverMessage.value = ''

    if (isLogin.value) {
        try {
            const payload = {
                email: formData.email,
                password: formData.password
            }
            const response = await axios.post('http://localhost:3000/api/auth/login', payload)

            // if (response.data?.message && !response.data?.token && !response.data?.success) {
            //     showMessage(response.data.message, 'error')
            //     return
            // }
            console.log("Login Response : ", response.data);
            if (response.data.accessToken) {
                await store.dispatch('auth/setToken', response.data.accessToken)
            }
            if (response.data.user) {
                await store.dispatch('auth/setUser', response.data.user)
            }

            console.log(store.getters['auth/getToken']);
            console.log(store.getters['auth/getUser']);

            showMessage('Login successful', 'success', true, 1500)
            emit('login', response.data)

            formData.email = ''
            formData.password = ''
            setTimeout(() => {
                emit('close')
                router.push('/')
            }, 1500)
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed'
            showMessage(msg, 'error')
            console.error('Login error:', err)
        }
    } else {
        if (formData.password !== formData.confirmPassword) {
            showMessage('Passwords do not match!', 'error')
            return
        }

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                password: formData.password
            }
            const response = await axios.post('http://localhost:3000/api/auth/register', payload)

            if (response.data?.message && !response.data?.success) {
                showMessage(response.data.message, 'error')
                return
            }

            showMessage('Account created successfully! Please login.', 'success', true, 2000)
            emit('signup', response.data)
            router.push('/')

            formData.name = ''
            formData.email = ''
            formData.password = ''
            formData.confirmPassword = ''
            setTimeout(() => {
                isLogin.value = true
            }, 2000)
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Signup failed'
            showMessage(msg, 'error')
            console.error('Signup error:', err)
        }
    }
}
</script>

<style scoped>
.auth-modal-overlay {
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

.auth-modal-content {
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

.auth-close-btn {
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

.auth-close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary);
}

.auth-header {
    text-align: center;
    margin-bottom: var(--spacing-xl);
}

.auth-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    margin-bottom: var(--spacing-xs);
}

.auth-subtitle {
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.auth-form {
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

.form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    font-size: var(--font-size-sm);
}

.forgot-password {
    color: var(--color-accent-primary);
    text-decoration: none;
    transition: color var(--transition-fast);
}

.forgot-password:hover {
    color: var(--color-accent-secondary);
}

.submit-btn {
    width: 100%;
    margin-top: var(--spacing-sm);
}

.auth-divider {
    text-align: center;
    margin: var(--spacing-xl) 0;
    position: relative;
}

.auth-divider::before,
.auth-divider::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 40%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
}

.auth-divider::before {
    left: 0;
}

.auth-divider::after {
    right: 0;
}

.auth-divider span {
    background: var(--color-bg-secondary);
    padding: 0 var(--spacing-md);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
}

.social-login {
    display: flex;
    gap: var(--spacing-md);
}

.social-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-bg-tertiary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-weight: 500;
    cursor: pointer;
    transition: all var(--transition-fast);
}

.social-btn:hover {
    background: var(--color-bg-card);
    border-color: rgba(255, 255, 255, 0.2);
}

.auth-footer {
    text-align: center;
    margin-top: var(--spacing-xl);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
}

.toggle-link {
    color: var(--color-accent-primary);
    text-decoration: none;
    font-weight: 600;
    margin-left: var(--spacing-xs);
    transition: color var(--transition-fast);
}

.toggle-link:hover {
    color: var(--color-accent-secondary);
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

@media (max-width: 576px) {
    .auth-modal-content {
        padding: var(--spacing-xl);
    }

    .auth-title {
        font-size: var(--font-size-xl);
    }

    .social-login {
        flex-direction: column;
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
</style>
