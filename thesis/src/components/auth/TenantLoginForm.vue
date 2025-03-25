<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'
import { useRouter } from 'vue-router'
import { signIn } from '@/api/auth' // Import the Supabase login function
import { requiredValidator, emailValidator } from '@/utils/validators' // Import validators

const router = useRouter()

// State Management
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

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
    const { user } = await signIn(email.value, password.value)

    if (user) {
      // Check if the user is a tenant
      const { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (userDetails.role === 'tenant') {
        // Redirect tenant to tenant dashboard
        router.replace('/tenant/TenantDashboard')
      } else {
        errorMessage.value = 'You are not authorized to access this page.'
        await supabase.auth.signOut() // Log out unauthorized users
      }
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
    :error-messages="!emailValidator(email) && email ? 'Enter a valid email address.' : ''"
  />
  <v-text-field
    v-model="password"
    label="Password"
    outlined
    dense
    color="blue"
    type="password"
    :error-messages="!requiredValidator(password) && password ? 'Password is required.' : ''"
  />

  <div class="d-flex justify-space-between align-center">
    <v-checkbox label="Remember Me" class="mt-n1" color="blue"></v-checkbox>
    <a href="#" class="text-blue">Forgot Password?</a>
  </div>

  <v-btn :loading="loading" @click="handleLogin" class="mb-5" color="#578e7e" dark block tile>
    Log in
  </v-btn>

  <p class="text-center text-caption">
    Don't have an account?
    <RouterLink class="text-primary" to="/register">Sign Up</RouterLink>
  </p>

  <p v-if="errorMessage" class="text-red text-caption text-center">{{ errorMessage }}</p>
</template>
