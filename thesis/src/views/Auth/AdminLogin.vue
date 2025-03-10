<script setup>
import signUpImage from '@/assets/images/Work time-amico.svg'
import AdminLoginForm from '@/components/auth/AdminLoginForm.vue'
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height mx-auto my-auto">
      <v-col cols="12" sm="10">
        <v-card class="elevation-6 mt-10 mx-auto my-auto bg-green-lighten-5">
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
                  <v-avatar color="#578E7E" size="100">
                    <v-icon size="70" color="white">mdi-account-tie</v-icon>
                  </v-avatar>
                  <p class="text-center text-h5 mt-3">Admin</p>
                </v-row>

                <v-row align="center" justify="center">
                  <v-col cols="12" sm="8">
                    <AdminLoginForm />
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
