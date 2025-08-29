<script setup>
import signUpImage from '@/assets/images/signUp.svg'
import TenantLoginForm from '@/components/auth/TenantLoginForm.vue'
import { useDisplay } from 'vuetify' // Import useDisplay for breakpoints

// Access Vuetify display breakpoints
const { smAndDown } = useDisplay() // Destructure smAndDown for mobile detection
</script>

<template>
  <v-container fluid class="gradient-background fill-height">
    <v-row align="center" justify="center" class="fill-height mx-auto my-auto">
      <v-col cols="12" :sm="smAndDown ? 12 : 10">
        <v-card :class="['elevation-12', smAndDown ? 'mt-4' : 'mt-10']" class="mx-auto my-auto">
          <v-row no-gutters :class="smAndDown ? 'flex-column' : ''">
            <!-- Image Column -->
            <v-col
              cols="12"
              :md="smAndDown ? 12 : 6"
              :class="smAndDown ? 'pa-4' : 'd-flex align-center justify-center pa-0'"
              :style="smAndDown ? 'max-height: 200px;' : 'height: 100%;'"
            >
              <v-img
                :src="signUpImage"
                :cover="smAndDown"
                :height="smAndDown ? '200px' : '100%'"
                :width="smAndDown ? '100%' : '100%'"
                alt="Sign Up"
              />
            </v-col>

            <!-- Form Column -->
            <v-col cols="12" :md="smAndDown ? 12 : 6">
              <v-card-text :class="smAndDown ? 'mt-6' : 'mt-12'">
                <v-row justify="center" align="center" class="flex-column">
                  <v-icon :size="smAndDown ? 80 : 100" class="mb-5"> mdi-account-circle </v-icon>
                </v-row>
                <p :class="['text-center mb-2', smAndDown ? 'text-h6' : 'text-h5']">
                  Welcome Back!
                </p>
                <p :class="['text-center', smAndDown ? 'text-body-2' : 'text-caption']">
                  Log in to access your account
                </p>

                <v-row align="center" justify="center">
                  <v-col :cols="smAndDown ? 12 : 12" :sm="smAndDown ? 10 : 8">
                    <TenantLoginForm />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Mobile Adjustments */
@media (max-width: 960px) {
  .v-card {
    border-radius: 12px;
  }

  .v-row {
    min-height: auto !important;
  }

  .v-card-text {
    padding: 16px !important; /* Consistent padding on mobile */
  }
}
</style>
