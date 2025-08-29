<script setup>
import signUpImage from '@/assets/images/signUp.svg'
import RegisterForm from '@/components/auth/RegisterForm.vue'
import { useDisplay } from 'vuetify' // Import useDisplay for breakpoints

// Access Vuetify display breakpoints
const { smAndDown } = useDisplay() // Destructure smAndDown for mobile detection
</script>

<template>
  <v-container fluid class="gradient-background fill-height">
    <v-row align="center" justify="center" class="fill-height mx-auto">
      <v-col cols="12" :sm="smAndDown ? 12 : 10">
        <v-card
          :class="['elevation-6', smAndDown ? 'mt-4' : 'mt-10']"
          class="fill-height mx-auto my-auto"
        >
          <v-row no-gutters :class="smAndDown ? 'flex-column' : ''">
            <!-- Image Column -->
            <v-col
              cols="12"
              :md="smAndDown ? 12 : 6"
              :class="smAndDown ? 'pa-4' : 'pa-0'"
              :style="smAndDown ? 'max-height: 200px;' : 'height: 100%;'"
            >
              <v-img
                :src="signUpImage"
                :cover="smAndDown"
                :height="smAndDown ? '200px' : '100%'"
                alt="Sign Up"
              />
            </v-col>

            <!-- Form Column -->
            <v-col cols="12" :md="smAndDown ? 12 : 6" class="d-flex align-center justify-center">
              <v-card-text :class="['w-100', smAndDown ? 'px-4 py-6' : 'px-8']">
                <RegisterForm />
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
}
</style>
