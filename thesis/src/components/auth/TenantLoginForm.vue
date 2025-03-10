<script setup></script>

<template>
  <v-text-field label="Email Address" outlined dense color="blue" class="mt-4" type="email" />
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
</template>
