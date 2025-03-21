<script setup>
import { ref, computed } from 'vue'
import TenantHistoryTable from '../History/components/TenantHistoryTable.vue'

// Simulate logged-in tenant's name (Replace this with actual user data from authentication)
const currentTenant = ref('John Doe')

// Payment data (Replace with real data from your backend)
const payments = ref([
  { id: 1, name: 'John Doe', amountPaid: 5000, date: 'March 1, 2025' },
  { id: 2, name: 'Jane Smith', amountPaid: 3200, date: 'March 5, 2025' },
  { id: 3, name: 'Michael Johnson', amountPaid: 4500, date: 'March 10, 2025' },
  { id: 4, name: 'John Doe', amountPaid: 5200, date: 'March 20, 2025' },
])

// Filter the payments for the logged-in tenant
const tenantPayments = computed(() =>
  payments.value.filter((payment) => payment.name === currentTenant.value),
)
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Payment History</h2>
        <p class="text-body-1 text-grey-lighten-1">Review your bill.</p>
      </v-col>
    </v-row>

    <v-card
      class="payment-history-card elevation-2 mt-10 fade-in delay-100"
      justify="center"
      align="center"
    >
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-history</v-icon>
        <span class="text-h6 font-weight-bold">My Payment History</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <TenantHistoryTable :payments="tenantPayments" />
      </v-card-text>
    </v-card>
  </v-container>
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
</style>
