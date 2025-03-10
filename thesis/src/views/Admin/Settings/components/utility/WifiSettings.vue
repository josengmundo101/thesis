<script setup>
import { ref } from 'vue'

const wifiBill = ref(800) // Default WiFi bill
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="green" class="mr-2">mdi-wifi</v-icon>
      WiFi Settings
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="wifiBill" label="WiFi Bill (₱)" type="number" variant="outlined" />
    </v-card-text>
  </v-card>
</template>
