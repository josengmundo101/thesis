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
        <StatCard color="white" flat icon="users" value="35" label="Total tenants" />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatCard color="white" flat icon="clock" value="20" label="Pending payments" />
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <StatCard color="white" flat icon="credit-card" value="15" label="Confirmed payments" />
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

<script setup>
import StatCard from './components/StatCard.vue'
import PendingConfirmedChart from './components/PendingConfirmedChart.vue'
import RevenueChart from './components/RevenueChart.vue'
import MonthlyRevenue from './components/MonthlyRevenue.vue'
</script>

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
