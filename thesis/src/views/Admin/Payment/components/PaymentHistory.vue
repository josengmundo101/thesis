<script setup>
import { ref } from 'vue'

const payments = ref([
  { id: 1, name: 'John Doe', amountPaid: 5000, date: 'March 1, 2025' },
  { id: 2, name: 'Jane Smith', amountPaid: 3200, date: 'March 5, 2025' },
  { id: 3, name: 'Michael Johnson', amountPaid: 4500, date: 'March 10, 2025' },
  { id: 4, name: 'Emily Davis', amountPaid: 2800, date: 'March 15, 2025' },
  { id: 5, name: 'Robert Brown', amountPaid: 5200, date: 'March 20, 2025' },
])

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}
</script>

<template>
  <v-card class="payment-history-card elevation-2">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-history</v-icon>
      <span class="text-h6 font-weight-bold">Payment History</span>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-table class="modern-table">
        <thead>
          <tr>
            <th class="text-left">Tenant Name</th>
            <th class="text-right">Amount Paid</th>
            <th class="text-left">Payment Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in payments" :key="payment.id">
            <td class="tenant-name">
              <v-avatar color="grey-lighten-3" size="32" class="mr-2">
                <span class="text-caption">
                  {{
                    payment.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  }}
                </span>
              </v-avatar>
              {{ payment.name }}
            </td>
            <td class="text-right font-mono text-primary">
              {{ formatCurrency(payment.amountPaid) }}
            </td>
            <td class="text-left">
              <v-icon color="green" class="mr-1">mdi-calendar-check</v-icon>
              {{ payment.date }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.payment-history-card {
  border-radius: 12px;
  overflow: hidden;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.payment-history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.08);
}

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

.tenant-name {
  display: flex;
  align-items: center;
  font-weight: 500;
}

.font-mono {
  font-family: 'Courier New', Courier, monospace;
}
</style>
