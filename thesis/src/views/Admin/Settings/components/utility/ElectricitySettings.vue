<script setup>
import { ref } from 'vue'

const electricityBill = ref(1200) // Default electricity bill
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="amber" class="mr-2">mdi-lightning-bolt</v-icon>
      Electricity Settings
    </v-card-title>
    <v-card-text>
      <v-text-field
        v-model="electricityBill"
        label="Electricity Bill (₱)"
        type="number"
        variant="outlined"
      />
    </v-card-text>
  </v-card>
</template>
