<script setup>
import { ref } from 'vue'
import BillingCard from './components/BillingCard.vue'
import SummaryCard from './components/SummaryCard.vue'
import NotificationCard from './components/NotificationCard.vue'

// Dummy data
const billing = ref({
  bills: [
    { name: 'Rent', amount: 1000, icon: 'mdi-home', color: 'green' },
    { name: 'Electricity', amount: 1250, icon: 'mdi-lightning-bolt', color: 'amber' },
    { name: 'Water', amount: 850, icon: 'mdi-water', color: 'blue' },
    { name: 'Internet', amount: 900, icon: 'mdi-wifi', color: 'indigo' },
  ],
  total: 3000,
})

const summary = ref({
  balance: 3000,
  dueDate: 'Jan 31, 2025',
})

const notifications = ref([
  'Payment for Dec 2024 was rejected.',
  'Your next payment is due Jan 31, 2025.',
])
</script>

<template>
  <v-container class="mt-8">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12" class="hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white">Welcome, John Doe!</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Here's a summary of your current billing status and upcoming payments.
        </p>
      </v-col>
    </v-row>

    <!-- Billing & Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <BillingCard :bills="billing.bills" :total="billing.total" />
      </v-col>

      <v-col cols="12" md="6">
        <SummaryCard :balance="summary.balance" :dueDate="summary.dueDate" />
      </v-col>
    </v-row>

    <!-- Notifications -->
    <v-row>
      <v-col cols="12">
        <NotificationCard :notifications="notifications" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
h2 {
  font-size: 28px;
}

.v-card {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s;
}

.v-card:hover {
  transform: translateY(-3px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);
}
</style>
