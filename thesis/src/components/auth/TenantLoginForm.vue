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
    const { user } = await signIn(email.value, password.value)

    if (user) {
      // Get user details from 'users' table
      const { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
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

  <v-alert v-if="errorMessage" type="error" dense class="mb-2">
    {{ errorMessage }}
  </v-alert>

  <v-btn :loading="loading" @click="handleLogin" class="mb-5 mt-12" color="#578e7e" dark block tile>
    Log in
  </v-btn>

  <p class="text-center text-caption">
    Don't have an account?
    <RouterLink class="text-primary" to="/register">Sign Up</RouterLink>
  </p>
</template>
