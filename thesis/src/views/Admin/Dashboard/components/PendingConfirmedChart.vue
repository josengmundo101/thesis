<template>
  <v-card class="pa-4 fade-in delay-100">
    <!-- Card Header -->
    <v-card-title class="text-h6 font-weight-medium">Payments Overview</v-card-title>

    <!-- Chart -->
    <v-card-text v-if="!isLoading && !error">
      <div class="chart-container">
        <VueApexCharts type="line" height="300" :options="chartOptions" :series="series" />
      </div>
    </v-card-text>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="my-4"> Error loading data: {{ error }} </v-alert>

    <!-- Loading State -->
    <v-card-text v-if="isLoading" class="text-center"> Loading data... </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { supabase } from '@/utils/supabase'

// State management
const isLoading = ref(true)
const error = ref(null)
const series = ref([
  { name: 'Pending Payments', data: [] },
  { name: 'Confirmed Payments', data: [] },
])

// Chart Options
const chartOptions = ref({
  chart: {
    type: 'line',
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
  yaxis: {},
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
    y: {
      formatter: function (value) {
        return value + (value === 1 ? ' payment' : ' payments')
      },
    },
  },
})

// Fetch and process payment data
const fetchPaymentData = async () => {
  try {
    isLoading.value = true
    error.value = null

    const { data: payments, error: supabaseError } = await supabase
      .from('payment')
      .select('status, payment_date')

    if (supabaseError) throw supabaseError

    // Initialize monthly counts (all 12 months)
    const monthlyCounts = Array(12)
      .fill()
      .map(() => ({
        pending: 0,
        confirmed: 0,
      }))

    // Process each payment
    payments?.forEach(({ status, payment_date }) => {
      const date = new Date(payment_date)
      const month = date.getMonth() // 0-11

      if (status === 'pending') {
        monthlyCounts[month].pending++
      } else if (status === 'approved') {
        monthlyCounts[month].confirmed++
      }
    })

    // Update chart data
    series.value = [
      {
        name: 'Pending Payments',
        data: monthlyCounts.map((m) => m.pending),
      },
      {
        name: 'Confirmed Payments',
        data: monthlyCounts.map((m) => m.confirmed),
      },
    ]
  } catch (err) {
    console.error('Payment data fetch error:', err)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Initialize component
onMounted(fetchPaymentData)
</script>

<style scoped>
.chart-container {
  width: 100%;
  min-height: 300px; /* Ensure chart has space to render */
}
</style>
