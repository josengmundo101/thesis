<script setup>
import signUpImage from '@/assets/images/signUp.svg'
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10">
        <v-card class="elevation-6 mt-10 bg-green-lighten-5">
          <v-row no-gutters>
            <!-- Left Column (Full Image) -->
            <v-col
              cols="12"
              md="6"
              class="d-flex align-center justify-center rounded-br-xl pa-0"
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
                    <v-text-field
                      label="Email Address"
                      outlined
                      dense
                      color="blue"
                      class="mt-4"
                      type="email"
                    />
                    <v-text-field label="Password" outlined dense color="blue" type="password" />

                    <div class="d-flex justify-space-between align-center">
                      <v-checkbox label="Remember Me" class="mt-n1" color="blue"></v-checkbox>
                      <a href="#" class="text-blue">Forgot Password?</a>
                    </div>

                    <v-btn class="mb-5" color="blue" dark block tile>Log in</v-btn>

                    <p class="text-center text-caption">
                      Don't have an account?
                      <RouterLink class="text-primary" to="/register">Sign Up</RouterLink>
                    </p>
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
