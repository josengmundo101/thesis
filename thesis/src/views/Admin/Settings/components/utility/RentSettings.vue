<script setup>
import { ref } from 'vue'

const rentAmount = ref(5000) // Default rent amount
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-home-city</v-icon>
      Rent Settings
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="rentAmount"
        label="Monthly Rent (₱)"
        type="number"
        variant="outlined"
      />
    </v-card-text>
  </v-card>
</template>
