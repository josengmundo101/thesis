<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  balance: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Summary</v-card-title>
    <v-divider></v-divider>
    <v-list density="compact">
      <v-list-item>
        <v-list-item-title>Outstanding Balance:</v-list-item-title>
        <v-list-item-subtitle class="text-h6 font-weight-bold text-error">
          ₱{{ props.balance }}
        </v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>Payment Due:</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold">{{ props.dueDate }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-card-actions>
      <v-btn color="primary" variant="flat"
        ><RouterLink to="/tenant/TenantPayment">Make Payment</RouterLink></v-btn
      >
      <v-btn color="secondary" variant="flat"
        ><RouterLink to="/tenant/TenantHistory"> History</RouterLink></v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<style scoped>
a {
  text-decoration: none; /* Remove underline from RouterLink */
  color: #d9d9d9;
}
</style>
