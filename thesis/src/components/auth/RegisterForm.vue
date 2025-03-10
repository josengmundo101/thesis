<script setup></script>

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
      <v-text-field label="First Name" outlined dense color="blue" class="mt-3" />
    </v-col>
    <v-col cols="12" sm="6">
      <v-text-field label="Last Name" outlined dense color="blue" class="mt-3" />
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
      <v-text-field label="Confirm Password" outlined dense color="blue" type="password" />
    </v-col>

    <v-col cols="12">
      <v-btn class="my-auto mx-auto" color="blue" dark block tile>Sign up</v-btn>
    </v-col>
  </v-row>
</template>
