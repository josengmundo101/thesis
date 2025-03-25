<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase' // Import Supabase
import { useRouter } from 'vue-router' // Import router
import { requiredValidator, emailValidator } from '@/utils/validators' // Import validators

// Variables
const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

// Handle Admin Login
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

    // Step 1: Sign In with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (authError) throw authError

    // Step 2: Fetch User Role from 'users' Table
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', authData.user.id)
      .single()
    if (fetchError) throw fetchError

    // Step 3: Check if Role is Admin
    if (userData.role !== 'admin') {
      throw new Error('Access denied. Admins only.')
    }

    // Step 4: Redirect to Admin Dashboard
    router.push('/admin/dashboard')
  } catch (error) {
    // Handle Errors
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

  <v-btn :loading="loading" @click="handleLogin" class="mb-5" color="#578e7e" dark block tile>
    Log in
  </v-btn>

  <p v-if="errorMessage" class="text-red text-caption text-center">{{ errorMessage }}</p>
</template>
