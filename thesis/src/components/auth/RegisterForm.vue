<script setup>
import { ref } from 'vue'
import { signUp } from '@/api/auth.js' // Import the Supabase sign-up function
import { useRouter } from 'vue-router' // For redirection
import {
  requiredValidator,
  emailValidator,
  passwordValidator,
  confirmedValidator,
} from '@/utils/validators' // Import custom validators

// Initialize router
const router = useRouter()

// Form data
const userData = ref({
  firstname: '',
  lastname: '',
  email: '',
  address: '',
  contact_number: '',
  password: '',
  confirmPassword: '',
})

// Form state
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Handle Registration
const handleRegister = async () => {
  // Reset messages
  errorMessage.value = ''
  successMessage.value = ''

  // Trim spaces
  Object.keys(userData.value).forEach((key) => {
    if (typeof userData.value[key] === 'string') {
      userData.value[key] = userData.value[key].trim()
    }
  })

  // 🔍 Form Validations
  if (!userData.value.firstname || !userData.value.lastname) {
    errorMessage.value = 'First name and Last name are required.'
    return
  }

  if (!emailValidator(userData.value.email)) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  if (!passwordValidator(userData.value.password)) {
    errorMessage.value =
      'Password must have 8 characters, uppercase, lowercase, number, and special character.'
    return
  }

  try {
    loading.value = true
    const { formStatus, formSuccessMessage, formErrorMessage } = await signUp(userData.value)

    if (formStatus === 200) {
      successMessage.value = formSuccessMessage
      // Redirect to Login or Dashboard
      setTimeout(() => router.replace('/login'), 2000)
    } else {
      errorMessage.value = formErrorMessage
    }
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

// Validator for Confirm Password
const confirmPasswordValidator = (value) => {
  if (!value) return 'Confirm password is required.'
  if (value !== userData.value.password) return 'Passwords do not match.'
  return true
}
</script>

<template>
  <div class="mb-3 mt-5">
    <p class="text-center text-h4 mb-2">Create An Account</p>
    <p class="text-center text-caption">
      Already have an account?
      <RouterLink class="text-primary" to="/login">Log in</RouterLink>
    </p>
  </div>

  <v-row>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="userData.firstname"
        label="First Name"
        outlined
        dense
        color="blue"
        :rules="[requiredValidator]"
      />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field
        v-model="userData.lastname"
        label="Last Name"
        outlined
        dense
        color="blue"
        :rules="[requiredValidator]"
      />
    </v-col>

    <v-col cols="12">
      <v-text-field
        v-model="userData.email"
        label="Email Address"
        outlined
        dense
        color="blue"
        :rules="[requiredValidator, emailValidator]"
      />
    </v-col>

    <v-col cols="12">
      <v-text-field
        v-model="userData.address"
        label="Address"
        outlined
        dense
        color="blue"
        :rules="[requiredValidator]"
      />
    </v-col>

    <v-col cols="12">
      <v-text-field
        v-model="userData.contact_number"
        label="Contact Number"
        outlined
        dense
        color="blue"
        :rules="[requiredValidator]"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        v-model="userData.password"
        label="Password"
        outlined
        dense
        color="blue"
        type="password"
        :rules="[requiredValidator, passwordValidator]"
      />
    </v-col>

    <v-col cols="12" sm="6">
      <v-text-field
        v-model="userData.confirmPassword"
        label="Confirm Password"
        outlined
        dense
        color="blue"
        type="password"
        :rules="[requiredValidator, confirmPasswordValidator]"
      />
    </v-col>

    <v-col cols="12">
      <v-alert v-if="errorMessage" type="error" dense class="mb-2">
        {{ errorMessage }}
      </v-alert>
      <v-alert v-if="successMessage" type="success" dense class="mb-2">
        {{ successMessage }}
      </v-alert>

      <v-btn
        :loading="loading"
        @click="handleRegister"
        class="my-auto mx-auto"
        color="#578e7e"
        dark
        block
        tile
      >
        Sign Up
      </v-btn>
    </v-col>
  </v-row>
</template>
