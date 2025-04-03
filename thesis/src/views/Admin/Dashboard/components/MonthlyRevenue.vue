<template>
  <v-card class="pa-4 fade-in delay-100">
    <!-- Card Header -->
    <v-card-title class="text-h6 font-weight-medium">Annual Revenue</v-card-title>

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

// Define years for labels (for example, from 2025 to 2035)
const yearsRange = Array.from({ length: 11 }, (_, index) => 2025 + index)

// Reactive state for chart data
const series = ref([
  {
    name: 'Revenue',
    data: Array(11).fill(0), // Default values (0) for each year (2025 - 2035)
  },
])

// Chart configuration with years as labels
const chartOptions = ref({
  chart: {
    type: 'area',
    toolbar: { show: false },
  },
  xaxis: {
    categories: yearsRange.map((year) => year.toString()), // Use year labels
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

// Fetch annual revenue data from Supabase
const fetchAnnualRevenueData = async () => {
  try {
    let { data: payments, error } = await supabase
      .from('payment')
      .select('amount, status, payment_date')

    if (error) throw error
    if (!payments) return

    // Initialize an array with 11 years (2025 - 2035) filled with 0 revenue
    const revenueData = Array(11).fill(0)

    // Process payments by year
    payments.forEach(({ amount, status, payment_date }) => {
      if (status === 'approved') {
        const year = new Date(payment_date).getFullYear()
        const yearIndex = year - 2025 // Mapping to index 0 for 2025, 1 for 2026, etc.

        if (year >= 2025 && year <= 2035) {
          revenueData[yearIndex] += amount
        }
      }
    })

    // Update chart data
    series.value[0].data = revenueData
  } catch (error) {
    console.error('Error fetching annual revenue data:', error.message)
  }
}

// Fetch data on mount
onMounted(fetchAnnualRevenueData)
</script>

<style scoped>
.chart-container {
  width: 100%;
}
</style>
