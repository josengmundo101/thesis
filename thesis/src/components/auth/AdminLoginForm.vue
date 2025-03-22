<script setup>
import { ref } from 'vue'
import { signIn } from '@/api/auth' // Import Supabase login function
import { requiredValidator, emailValidator } from '../../utils/validators' // Import validators

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  errorMessage.value = ''

  // Validate email and password
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
    const { user } = await signIn(email.value, password.value) // Call Supabase login

    if (user) {
      // Redirect to Admin Dashboard (Replace with your route)
      window.location.href = '/admin/dashboard'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>

<template>
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

  <v-btn :loading="loading" @click="handleLogin" class="mb-5" color="blue" dark block tile>
    Log in
  </v-btn>

  <p v-if="errorMessage" class="text-red text-caption text-center">{{ errorMessage }}</p>
</template>
