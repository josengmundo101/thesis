<script setup>
import { ref, computed } from 'vue'

const bills = ref([
  { name: 'Rent', amount: 2000, icon: 'mdi-home', color: 'green' },
  { name: 'Electricity', amount: 1250, icon: 'mdi-lightning-bolt', color: 'amber' },
  { name: 'Water', amount: 850, icon: 'mdi-water', color: 'blue' },
  { name: 'Internet', amount: 900, icon: 'mdi-wifi', color: 'indigo' },
])

const totalAmount = computed(() => bills.value.reduce((sum, bill) => sum + bill.amount, 0))
</script>

<template>
  <v-card elevation="1" class="hover-sclae fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Bill Summary</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-list density="compact">
        <v-list-item v-for="bill in bills" :key="bill.name">
          <template v-slot:prepend>
            <v-icon :color="bill.color" class="mr-2">{{ bill.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ bill.name }}</v-list-item-title>
          <v-list-item-subtitle class="text-h6 font-weight-bold">{{
            bill.amount
          }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-divider></v-divider>
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Total Due: {{ totalAmount }}
    </v-card-text>
  </v-card>
</template>
