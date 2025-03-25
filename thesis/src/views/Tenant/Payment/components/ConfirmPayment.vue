<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
const store = useUtilityStore()
</script>

<template>
  <v-card elevation="1" class="pa-4 text-center hover-scale fade-in delay-150">
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Total Amount: ₱{{ Number(store.electricity) + Number(store.water) + Number(store.wifi) }}
    </v-card-text>
    <v-btn block color="primary" class="py-3" @click="redirectToPayMongo">
      Pay with PayMongo
    </v-btn>
  </v-card>
</template>
