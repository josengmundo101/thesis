<template>
  <v-card class="pa-4 fade-in delay-100">
    <!-- Card Header -->
    <v-card-title class="text-h6 font-weight-medium">Payments Overview</v-card-title>

    <!-- Chart -->
    <v-card-text>
      <div class="chart-container">
        <VueApexCharts type="line" height="300" :options="chartOptions" :series="series" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Chart Data
const series = ref([
  {
    name: 'Pending Payments',
    data: [5, 8, 6, 10, 7, 12], // Data for Pending
  },
  {
    name: 'Confirmed Payments',
    data: [10, 12, 8, 15, 9, 18], // Data for Confirmed
  },
])

// Chart Options
const chartOptions = ref({
  chart: {
    type: 'line',
    toolbar: { show: false },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  },
  colors: ['#ff9800', '#4caf50'], // Orange for pending, Green for confirmed
  stroke: {
    curve: 'smooth',
    width: 3,
  },
  markers: {
    size: 5,
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: 'light',
  },
})
</script>

<style scoped>
.chart-container {
  width: 100%;
}
</style>
