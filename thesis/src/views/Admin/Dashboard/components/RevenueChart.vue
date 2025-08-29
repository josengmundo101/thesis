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
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import VueApexCharts from 'vue3-apexcharts'

// Define month names for labels
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Reactive state for chart data
const series = ref([
  {
    name: 'Revenue',
    data: Array(12).fill(0), // Default values (0) for each month
  },
])

// Chart configuration with month names as labels
const chartOptions = ref({
  chart: {
    type: 'area',
    toolbar: { show: false },
  },
  xaxis: {
    categories: monthNames, // Use full month names
  },
  colors: ['#81C784'], // Green color for revenue trend
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
      formatter: (value) => `₱${value.toLocaleString()}`,
    },
  },
})

// Fetch revenue data from Supabase
const fetchRevenueData = async () => {
  try {
    let { data: payments, error } = await supabase
      .from('payment')
      .select('amount, status, payment_date')

    if (error) throw error
    if (!payments) return

    // Initialize an array with 12 months filled with 0 revenue
    const revenueData = Array(12).fill(0)

    // Process payments by month
    payments.forEach(({ amount, status, payment_date }) => {
      if (status === 'approved') {
        const monthIndex = new Date(payment_date).getMonth()
        revenueData[monthIndex] += amount
      }
    })

    // Update chart data
    series.value[0].data = revenueData
  } catch (error) {
    console.error('Error fetching revenue data:', error.message)
  }
}

// Fetch data on mount
onMounted(fetchRevenueData)
</script>

<style scoped>
.chart-container {
  width: 100%;
}
</style>
