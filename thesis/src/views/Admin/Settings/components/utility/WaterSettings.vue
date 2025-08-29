<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'

const store = useUtilityStore()

const updateWater = (value) => {
  store.updateUtility('water', Number(value))
}
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="amber" class="mr-2">mdi-lightning-bolt</v-icon>
      Water Settings
    </v-card-title>
    <v-card-text>
      <v-text-field
        :value="store.water"
        label="Water Bill (₱)"
        type="number"
        variant="outlined"
        @input="updateWater($event)"
      />
    </v-card-text>
  </v-card>
</template>
