<template>
  <v-card class="hover-scale fade-in delay-100">
    <!-- Card Header -->
    <v-card-title class="pb-2 mt-3 text-h6 font-weight-medium"> Monthly Revenue </v-card-title>

    <!-- Card Content -->
    <v-card-text>
      <div class="chart-container">
        <VueApexCharts type="bar" height="300" :options="chartOptions" :series="series" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Revenue Data
const series = ref([
  {
    name: 'Revenue',
    data: [4000, 6000, 5000, 8000, 7000, 9500, 8500, 10000, 11000, 9000, 12000, 15000],
  },
])

// Chart Options
const chartOptions = ref({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  xaxis: {
    categories: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
  },
  colors: ['#81C784'],
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: '50%',
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
