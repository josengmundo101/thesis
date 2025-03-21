<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  payments: Array,
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <v-table v-if="payments.length > 0" class="modern-table fade-in delay-100">
    <thead>
      <tr>
        <th class="text-left">Amount Paid</th>
        <th class="text-left">Payment Date</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="payment in payments" :key="payment.id">
        <td class="text-left font-mono text-primary">
          {{ formatCurrency(payment.amountPaid) }}
        </td>
        <td class="text-left">
          <v-icon color="green" class="mr-1">mdi-calendar-check</v-icon>
          {{ payment.date }}
        </td>
      </tr>
    </tbody>
  </v-table>

  <!-- Show message if no payment history -->
  <div v-if="payments.length === 0" class="no-history">
    <v-icon size="36" color="grey">mdi-alert-circle-outline</v-icon>
    <p>No payment history available.</p>
  </div>
</template>

<style scoped>
.modern-table {
  border-collapse: collapse;
  width: 100%;
}

th {
  background: #f7f9fc;
  font-weight: 600;
  text-transform: uppercase;
  padding: 12px;
}

td {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

tr:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}

.no-history {
  text-align: center;
  padding: 20px;
  color: grey;
}
</style>
