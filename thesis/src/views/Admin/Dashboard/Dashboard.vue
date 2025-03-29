<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import StatCard from './components/StatCard.vue'
import PendingConfirmedChart from './components/PendingConfirmedChart.vue'
import RevenueChart from './components/RevenueChart.vue'
import MonthlyRevenue from './components/MonthlyRevenue.vue'

// State Variables
const totalTenants = ref(0)
const pendingPayments = ref(0)
const confirmedPayments = ref(0)

// Fetch Tenants
const fetchTenants = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').eq('role', 'tenant')

    if (error) throw error
    totalTenants.value = data.length
    console.log('Total Tenants:', totalTenants.value)
  } catch (error) {
    console.log('Error fetching tenants:', error.message)
  }
}

// Fetch Pending Payments
const fetchPendingPayments = async () => {
  try {
    const { data, error } = await supabase.from('payment').select('*').eq('status', 'pending')

    if (error) throw error
    pendingPayments.value = data.length
    console.log('Pending Payments:', pendingPayments.value)
  } catch (error) {
    console.log('Error fetching pending payments:', error.message)
  }
}

// Fetch Confirmed Payments
const fetchConfirmedPayments = async () => {
  try {
    const { data, error } = await supabase.from('payment').select('*').eq('status', 'approved') // Ensure status matches DB

    if (error) throw error
    confirmedPayments.value = data.length
    console.log('Confirmed Payments:', confirmedPayments.value)
  } catch (error) {
    console.log('Error fetching confirmed payments:', error.message)
  }
}

// Lifecycle Hook
onMounted(() => {
  fetchTenants()
  fetchPendingPayments()
  fetchConfirmedPayments()
})
</script>

<template>
  <v-container fluid>
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Dashboard</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        Track your revenue, payments, and tenant statistics from a centralized dashboard.
      </p>
    </div>

    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <StatCard color="white" flat icon="users" :value="totalTenants" label="Total tenants" />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatCard
          color="white"
          flat
          icon="clock"
          :value="pendingPayments"
          label="Pending payments"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatCard
          color="white"
          flat
          icon="credit-card"
          :value="confirmedPayments"
          label="Confirmed payments"
        />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatCard color="white" flat icon="chart" value="20,000" label="Total revenue" />
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row dense class="mt-6">
      <v-col cols="12" md="6">
        <PendingConfirmedChart color="white" flat />
      </v-col>
      <v-col cols="12" md="6">
        <RevenueChart color="white" flat />
      </v-col>
    </v-row>
    <v-row class="mt-6">
      <v-col cols="12">
        <MonthlyRevenue color="white" flat />
      </v-col>
    </v-row>
  </v-container>
</template>

<style setup>
.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
}

/* Fade-in Animations */
.fade-in {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.6s ease-out forwards;
}

.delay-50 {
  animation-delay: 50ms;
}

.delay-100 {
  animation-delay: 100ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
