<script setup>
import { ref } from 'vue'

const rentAmount = ref(2500) // Default rent value
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="deep-purple" class="mr-2">mdi-home-city</v-icon>
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
