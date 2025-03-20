<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  bills: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
})
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Billing Details</v-card-title>
    <v-divider></v-divider>
    <v-list density="compact">
      <v-list-item v-for="(bill, index) in props.bills" :key="index">
        <template v-slot:prepend>
          <v-icon :color="bill.color">{{ bill.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ bill.name }}</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold text-primary">
          ₱{{ bill.amount }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-card-text class="text-h6 font-weight-bold">Total: ₱{{ props.total }}</v-card-text>
  </v-card>
</template>
