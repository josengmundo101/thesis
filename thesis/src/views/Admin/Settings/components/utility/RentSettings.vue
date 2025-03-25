<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'

const store = useUtilityStore()

const updateRent = (value) => {
  store.updateUtility('rent', Number(value))
}
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="amber" class="mr-2">mdi-lightning-bolt</v-icon>
      Rent Settings
    </v-card-title>
    <v-card-text>
      <v-text-field
        :value="store.rent"
        label="Rent Bill (₱)"
        type="number"
        variant="outlined"
        @input="updateRent($event)"
      />
    </v-card-text>
  </v-card>
</template>
