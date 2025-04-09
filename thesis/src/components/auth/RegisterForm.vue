<script setup>
import { ref } from 'vue'
import { signUp } from '@/api/auth.js'
import { useRouter } from 'vue-router'
import { requiredValidator, emailValidator, passwordValidator } from '@/utils/validators'
import { toast } from 'vue3-toastify'

const showPassword = ref(false)
const router = useRouter()

const userData = ref({
  firstname: '',
  lastname: '',
  email: '',
  address: '',
  contact_number: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleRegister = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  Object.keys(userData.value).forEach((key) => {
    if (typeof userData.value[key] === 'string') {
      userData.value[key] = userData.value[key].trim()
    }
  })

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

  if (userData.value.password !== userData.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  try {
    loading.value = true
    const { formStatus, formSuccessMessage, formErrorMessage, user, role } = await signUp(
      userData.value,
    )

    if (formStatus === 200) {
      successMessage.value = formSuccessMessage
      toast.success(formSuccessMessage)

      setTimeout(() => {
        if (role === 'admin') {
          router.replace('/admin/dashboard')
        } else {
          router.replace('/login')
        }
      }, 2000)
    } else {
      errorMessage.value = formErrorMessage
      toast.error(formErrorMessage)
    }
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong.'
    toast.error(error.message || 'Something went wrong.')
  } finally {
    loading.value = false
  }
}

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
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
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
        :type="showPassword ? 'text' : 'password'"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
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
