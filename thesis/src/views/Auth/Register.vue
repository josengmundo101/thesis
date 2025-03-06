<script setup>
import signUpImage from '@/assets/images/signUp.svg'
</script>

<template>
  <v-container fluid class="fill-height">
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" sm="10">
        <v-card class="elevation-6 mt-10 fill-height bg-green-lighten-5">
          <v-row no-gutters class="fill-height">
            <!-- Left Column (Full Image) -->
            <v-col cols="12" md="6" class="pa-0">
              <v-img :src="signUpImage" cover class="fill-height" alt="Sign Up" />
            </v-col>

            <!-- Right Column (Register Form) -->
            <v-col cols="12" md="6" class="d-flex align-center justify-center">
              <v-card-text class="w-100 px-8">
                <div class="mb-3 mt-5">
                  <p class="text-center text-h5 mb-2">Create An Account</p>
                  <p class="text-center text-caption">
                    Already have an account?
                    <RouterLink class="text-primary" to="/login">Log in</RouterLink>
                  </p>
                </div>

                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field label="First Name" outlined dense color="blue" class="mt-4" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field label="Last Name" outlined dense color="blue" class="mt-4" />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field label="Address" outlined dense color="blue" />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field label="Contact Number" outlined dense color="blue" />
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field label="Password" outlined dense color="blue" type="password" />
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      label="Confirm Password"
                      outlined
                      dense
                      color="blue"
                      type="password"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-checkbox
                      label="I agree to the Terms & Conditions"
                      class="mt-n1"
                      color="blue"
                    ></v-checkbox>
                  </v-col>

                  <v-col cols="12">
                    <v-btn class="mb-5" color="blue" dark block tile>Sign up</v-btn>
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
