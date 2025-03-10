<script setup>
import { ref } from 'vue'

const waterBill = ref(500) // Default water bill
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="blue" class="mr-2">mdi-water</v-icon>
      Water Settings
    </v-card-title>
    <v-card-text>
      <v-text-field v-model="waterBill" label="Water Bill (₱)" type="number" variant="outlined" />
    </v-card-text>
  </v-card>
</template>
