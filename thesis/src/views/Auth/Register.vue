<script setup>
import signUpImage from '@/assets/images/signUp.svg'
import RegisterForm from '@/components/auth/RegisterForm.vue'
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height mx-auto">
      <v-col cols="12" sm="10">
        <v-card class="elevation-6 mt-10 fill-height mx-auto my-auto bg-green-lighten-5">
          <v-row no-gutters class="fill-height">
            <!-- Left Column (Full Image) -->
            <v-col cols="12" md="6" class="pa-0">
              <v-img :src="signUpImage" cover class="fill-height" alt="Sign Up" />
            </v-col>

            <!-- Right Column (Register Form) -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center">
              <v-card-text class="w-100 px-8">
                <RegisterForm />
              </v-card-text>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
