<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  payments: Array,
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <v-table v-if="payments.length > 0" class="modern-table fade-in delay-100">
    <thead>
      <tr>
        <th class="text-left">Amount Paid</th>

        <th class="text-left">Payment Method</th>
        <th class="text-left">Payment Date</th>
        <th class="text-left">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="payment in payments" :key="payment.id">
        <td>{{ payment.amount }}</td>
        <td>{{ payment.method }}</td>
        <td>{{ payment.date }}</td>
        <!-- Make sure this exists -->
        <td>{{ payment.status }}</td>
      </tr>
    </tbody>
  </v-table>

  <div v-if="payments.length === 0" class="no-history">
    <v-icon size="36" color="grey">mdi-alert-circle-outline</v-icon>
    <p>No payment history available.</p>
  </div>
</template>
