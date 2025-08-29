<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'

const store = useUtilityStore()

const updateInternet = (value) => {
  store.updateUtility('internet', Number(value))
}
</script>

<template>
  <v-card class="utility-card" flat>
    <v-card-title class="d-flex align-center">
      <v-icon color="amber" class="mr-2">mdi-lightning-bolt</v-icon>
      Wifi Settings
    </v-card-title>
    <v-card-text>
      <v-text-field
        :value="store.internet"
        label="Wifi Bill (₱)"
        type="number"
        variant="outlined"
        @input="updateInternet($event)"
      />
    </v-card-text>
  </v-card>
</template>
