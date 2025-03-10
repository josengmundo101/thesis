<script setup>
import signUpImage from '@/assets/images/signUp.svg'
import TenantLoginForm from '@/components/auth/TenantLoginForm.vue'
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height mx-auto my-auto">
      <v-col cols="12" sm="10">
        <v-card class="elevation-12 mt-10 mx-auto my-auto bg-green-lighten-5">
          <v-row no-gutters>
            <!-- Left Column (Full Image) -->
            <v-col
              cols="12"
              md="6"
              class="d-flex align-center justify-center pa-0"
              style="height: 100%"
            >
              <v-img :src="signUpImage" cover height="100%" width="100%" alt="Sign Up" />
            </v-col>

            <!-- Right Column (Login Form) -->
            <v-col cols="12" md="6">
              <v-card-text class="mt-12">
                <v-row justify="center" align="center" class="flex-column">
                  <v-icon class="mb-5" size="100">mdi-account-circle</v-icon>
                </v-row>
                <p class="text-center text-h5 mb-2">Welcome Back!</p>
                <p class="text-center text-caption">Log in to access your account</p>

                <v-row align="center" justify="center">
                  <v-col cols="12" sm="8">
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
