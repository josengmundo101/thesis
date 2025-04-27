<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'vue-router'
import { signIn } from '@/api/auth'
import { requiredValidator, emailValidator, passwordValidator } from '@/utils/validators'

const router = useRouter()

// State Management
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

// Handle Tenant Login
const handleLogin = async () => {
  errorMessage.value = ''

  // Basic Validation
  if (!requiredValidator(email.value)) {
    errorMessage.value = 'Email is required.'
    return
  }
  if (!emailValidator(email.value)) {
    errorMessage.value = 'Enter a valid email address.'
    return
  }
  if (!requiredValidator(password.value)) {
    errorMessage.value = 'Password is required.'
    return
  }

  try {
    loading.value = true
    const result = await signIn(email.value, password.value)

    // Check if the result contains a user (successful login)
    if (result && result.user) {
      // Get user details from 'users' table
      const { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', result.user.id)
        .single()

      if (error) throw error

      // Check role and approval status
      if (userDetails.role !== 'tenant') {
        errorMessage.value = 'Only tenant accounts can log in here.'
        await supabase.auth.signOut()
        return
      }

      if (userDetails.status !== 'approved') {
        errorMessage.value = 'Your account is not yet approved.'
        await supabase.auth.signOut()
        return
      }

      // ✅ Approved tenant
      router.replace('/tenant/TenantDashboard')
    }
  } catch (error) {
    errorMessage.value = error.message || 'Invalid credentials.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Form -->
  <v-text-field
    v-model="email"
    label="Email Address"
    outlined
    dense
    color="blue"
    class="mt-4"
    type="email"
    :rules="[requiredValidator]"
    :error-messages="!emailValidator(email) && email ? 'Enter a valid email address.' : ''"
  />
  <v-text-field
    v-model="password"
    label="Password"
    outlined
    dense
    color="blue"
    :type="showPassword ? 'text' : 'password'"
    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
    @click:append-inner="showPassword = !showPassword"
    :rules="[requiredValidator]"
    :error-messages="!passwordValidator(password) && password ? 'Password is required.' : ''"
  />

  <!-- Custom Error Message -->
  <div v-if="errorMessage" class="custom-error-message mt-3 mb-4">
    <span>{{ errorMessage }}</span>
  </div>

  <v-btn
    :loading="loading"
    :disabled="loading || !email || !password"
    @click="handleLogin"
    class="mb-5 mt-3"
    color="#578e7e"
    dark
    block
    tile
  >
    Log in
  </v-btn>

  <p class="text-center text-caption">
    Don't have an account?
    <RouterLink class="text-primary" to="/register">Sign Up</RouterLink>
  </p>
</template>

<style scoped>
.custom-error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(229, 115, 115, 0.12); /* Slightly softer red background */
  color: #d32f2f; /* Slightly darker red text for better contrast */
  padding: 10px 14px; /* Slightly more padding for balance */
  border-radius: 8px; /* Smoother corners */
  font-size: 0.9rem; /* Slightly larger font for readability */
  font-weight: 500; /* Medium weight for emphasis */
  line-height: 1.5; /* Better line spacing */
  border: 1px solid rgba(229, 115, 115, 0.25); /* Softer border */
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08); /* Slightly deeper shadow for depth */
  max-width: 100%; /* Ensure it doesn’t overflow on smaller screens */
  text-align: center;
}

/* Subtle animation for the error message */
.custom-error-message {
  animation: slideIn 0.4s ease-in-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
