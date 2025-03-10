<template>
  <v-card class="pa-4 fade-in delay-100">
    <!-- Card Header -->
    <v-card-title class="text-h6 font-weight-medium">Total Revenue</v-card-title>

    <!-- Chart -->
    <v-card-text>
      <div class="chart-container">
        <VueApexCharts type="area" height="300" :options="chartOptions" :series="series" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Data for the chart
const series = ref([
  {
    name: 'Revenue',
    data: [4000, 5000, 3000, 7000, 5000, 9000], // Revenue values per month
  },
])

// Chart configuration
const chartOptions = ref({
  chart: {
    type: 'area',
    toolbar: { show: false },
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], // Month names
  },
  colors: ['#81C784'], // Blue color for revenue trend
  stroke: {
    curve: 'smooth',
  },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.6,
      opacityTo: 0.1,
      stops: [20, 100],
    },
  },
  dataLabels: {
    enabled: false,
  },
  tooltip: {
    theme: 'light',
    y: {
      formatter: (value) => `$${value}`,
    },
  },
})
</script>

<style scoped>
.chart-container {
  width: 100%;
}
</style>
