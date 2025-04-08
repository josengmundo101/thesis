<script setup>
import { ref, computed, onMounted, watch } from 'vue' // Added watch import
import { supabase } from '@/utils/supabase'

// Reactive state variables
const earnings = ref([])
const filteredEarnings = ref([]) // Added filteredEarnings
const isLoading = ref(true)
const error = ref(null)
const isPrinting = ref(false)
const durationFilter = ref('12months') // Added duration filter

// Duration options - simplified format for v-select
const durationOptions = ['Last 3 Months', 'Last 6 Months', 'Last 12 Months', 'All Time']

// Duration values mapping
const durationValues = {
  'Last 3 Months': '3months',
  'Last 6 Months': '6months',
  'Last 12 Months': '12months',
  'All Time': 'all',
}

// Calculate totals based on filtered data
const totalRevenue = computed(() =>
  filteredEarnings.value.reduce((sum, item) => sum + (item.totalCollected || 0), 0),
)

const totalPending = computed(() =>
  filteredEarnings.value.reduce((sum, item) => sum + (item.pendingPayments || 0), 0),
)

const totalExpected = computed(() =>
  filteredEarnings.value.reduce((sum, item) => sum + (item.expectedIncome || 0), 0),
)

// Apply duration filter
const applyDurationFilter = () => {
  const filterValue = durationFilter.value
  if (filterValue === 'all') {
    filteredEarnings.value = [...earnings.value]
    return
  }

  const monthsToShow = parseInt(filterValue)
  const currentDate = new Date()
  const cutoffDate = new Date(currentDate)
  cutoffDate.setMonth(currentDate.getMonth() - monthsToShow)

  filteredEarnings.value = earnings.value.filter((item) => {
    const monthIndex = new Date(`${item.month} 1, ${item.year}`).getMonth()
    const itemDate = new Date(item.year, monthIndex, 1)
    return itemDate >= cutoffDate
  })
}

// Fetch earnings data from Supabase
const fetchEarnings = async () => {
  isLoading.value = true
  error.value = null

  try {
    let { data: payments, error: supabaseError } = await supabase
      .from('payment')
      .select('amount, status, payment_date')

    if (supabaseError) throw supabaseError
    if (!payments || payments.length === 0) {
      earnings.value = []
      filteredEarnings.value = []
      return
    }

    // Process data into monthly summaries
    const monthlyEarnings = {}

    payments.forEach(({ amount, status, payment_date }) => {
      const date = new Date(payment_date)
      const month = date.toLocaleString('en-US', { month: 'long' })
      const year = date.getFullYear()
      const monthYearKey = `${month} ${year}`

      if (!monthlyEarnings[monthYearKey]) {
        monthlyEarnings[monthYearKey] = {
          month,
          year,
          totalCollected: 0,
          pendingPayments: 0,
          expectedIncome: 0,
        }
      }

      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
      monthlyEarnings[monthYearKey].expectedIncome += numAmount

      if (status === 'approved') {
        monthlyEarnings[monthYearKey].totalCollected += numAmount
      } else if (status === 'pending') {
        monthlyEarnings[monthYearKey].pendingPayments += numAmount
      }
    })

    // Sort by year and month
    earnings.value = Object.values(monthlyEarnings).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return (
        new Date(`${b.month} 1, ${b.year}`).getMonth() -
        new Date(`${a.month} 1, ${a.year}`).getMonth()
      )
    })

    applyDurationFilter()
  } catch (err) {
    console.error('Error fetching earnings:', err.message)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

const printEarningsReport = () => {
  isPrinting.value = true

  const printWindow = window.open('', '_blank')

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Monthly Earnings Report (${durationOptions.find((d) => d.value === durationFilter.value)?.text || 'Custom Range'})</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .print-container { max-width: 1000px; margin: 0 auto; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1976D2; padding-bottom: 10px; }
        .print-header h1 { color: #1976D2; margin-bottom: 5px; }
        .print-header p { color: #666; margin-top: 0; }
        .stats-container { display: flex; justify-content: space-between; margin-bottom: 20px; gap: 15px; }
        .stat-box { flex: 1; padding: 15px; border-radius: 8px; background: #f5f5f5; border: 1px solid #e0e0e0; }
        .stat-title { font-size: 14px; color: #666; margin-bottom: 5px; font-weight: bold; }
        .stat-value { font-size: 20px; font-weight: bold; }
        .stat-revenue { color: #1976D2; }
        .stat-pending { color: #FF9800; }
        .stat-expected { color: #4CAF50; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th { background: #1976D2; color: white; padding: 10px; text-align: left; font-weight: bold; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .text-primary { color: #1976D2; }
        .text-warning { color: #FF9800; }
        .text-success { color: #4CAF50; }
        tfoot td { font-weight: bold; background: #f5f5f5; }
        .progress-container { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
        .progress-bar { height: 8px; background: #e0e0e0; border-radius: 4px; width: 100px; overflow: hidden; }
        .progress-fill { height: 100%; background: #1976D2; border-radius: 4px; }
        .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        @page { size: auto; margin: 10mm; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="print-header">
          <h1>Monthly Earnings Report</h1>
          <p>${durationOptions.find((d) => d.value === durationFilter.value)?.text || 'Custom Range'} • Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="stats-container">
          <div class="stat-box">
            <div class="stat-title">TOTAL COLLECTED</div>
            <div class="stat-value stat-revenue">${formatCurrency(totalRevenue.value)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">PENDING PAYMENTS</div>
            <div class="stat-value stat-pending">${formatCurrency(totalPending.value)}</div>
          </div>
          <div class="stat-box">
            <div class="stat-title">EXPECTED INCOME</div>
            <div class="stat-value stat-expected">${formatCurrency(totalExpected.value)}</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th class="text-right">Total Collected</th>
              <th class="text-right">Pending Payments</th>
              <th class="text-right">Expected Income</th>
              <th class="text-right">Collection Rate</th>
            </tr>
          </thead>
          <tbody>
            ${filteredEarnings.value
              .map((item) => {
                const collectionRate = getCollectionPercentage(
                  item.totalCollected,
                  item.expectedIncome,
                )
                return `
                <tr>
                  <td>${item.month} ${item.year}</td>
                  <td class="text-right text-primary">${formatCurrency(item.totalCollected)}</td>
                  <td class="text-right text-warning">${formatCurrency(item.pendingPayments)}</td>
                  <td class="text-right text-success">${formatCurrency(item.expectedIncome)}</td>
                  <td class="text-right">
                    <div class="progress-container">
                      <span>${collectionRate}%</span>
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: ${collectionRate}%"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              `
              })
              .join('')}
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Total</strong></td>
              <td class="text-right text-primary"><strong>${formatCurrency(totalRevenue.value)}</strong></td>
              <td class="text-right text-warning"><strong>${formatCurrency(totalPending.value)}</strong></td>
              <td class="text-right text-success"><strong>${formatCurrency(totalExpected.value)}</strong></td>
              <td class="text-right"><strong>${getCollectionPercentage(totalRevenue.value, totalExpected.value)}%</strong></td>
            </tr>
          </tfoot>
        </table>
        
        <div class="print-footer">
          <p>End of Report • Generated by Tenant Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(printContent)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
    isPrinting.value = false
  }
}

// Helper functions
const formatCurrency = (value) => {
  if (value === null || value === undefined) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

const getCollectionPercentage = (collected, expected) => {
  return expected > 0 ? Math.round((collected / expected) * 100) : 0
}

// Fetch data on component mount
onMounted(fetchEarnings)

// Watch for duration filter changes
watch(durationFilter, applyDurationFilter)
</script>

<template>
  <v-card class="earnings-card" elevation="1">
    <v-card-item>
      <template v-slot:prepend>
        <v-icon color="primary" icon="mdi-finance" size="large" class="mr-2"></v-icon>
      </template>
      <v-card-title class="text-h5 font-weight-bold">Monthly Earnings Summary</v-card-title>
      <template v-slot:append>
        <v-select
          v-model="durationFilter"
          :items="durationOptions"
          density="compact"
          variant="outlined"
          hide-details
          style="max-width: 160px; margin-right: 12px"
          class="duration-filter"
          label="Time Period"
        ></v-select>
        <v-btn
          variant="text"
          prepend-icon="mdi-printer"
          color="primary"
          size="small"
          @click="printEarningsReport"
          :loading="isPrinting"
        >
          Print
        </v-btn>
        <v-btn
          variant="text"
          prepend-icon="mdi-refresh"
          color="primary"
          size="small"
          @click="fetchEarnings"
          :loading="isLoading"
        >
          Refresh
        </v-btn>
      </template>
    </v-card-item>

    <v-divider class="mx-4 my-2"></v-divider>

    <v-card-text>
      <v-alert v-if="error" type="error" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <div v-if="isLoading" class="d-flex justify-center align-center my-6">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <div v-else-if="earnings.length === 0" class="d-flex justify-center align-center my-6">
        <v-alert type="info" class="mb-0">No payment data available</v-alert>
      </div>

      <template v-else>
        <div class="d-flex flex-wrap gap-4 my-4">
          <v-sheet rounded="lg" class="pa-4 flex-grow-1 bg-primary-lighten-5">
            <div class="text-overline text-grey">Total Collected</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(totalRevenue) }}</div>
            <div class="text-caption text-grey-darken-1">
              Showing {{ filteredEarnings.length }} of {{ earnings.length }} months
            </div>
          </v-sheet>
          <v-sheet rounded="lg" class="pa-4 flex-grow-1 bg-warning-lighten-5">
            <div class="text-overline text-grey">Pending Payments</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(totalPending) }}</div>
          </v-sheet>
          <v-sheet rounded="lg" class="pa-4 flex-grow-1 bg-success-lighten-5">
            <div class="text-overline text-grey">Expected Income</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(totalExpected) }}</div>
          </v-sheet>
        </div>

        <v-table class="rounded-lg">
          <thead>
            <tr class="text-grey bg-grey-lighten-4">
              <th class="text-left pl-4">Month</th>
              <th class="text-right">Total Collected</th>
              <th class="text-right">Pending Payments</th>
              <th class="text-right">Expected Income</th>
              <th class="text-right pr-4">Collection Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in filteredEarnings" :key="index" class="earnings-row">
              <td class="pl-4 font-weight-medium">{{ item.month }} {{ item.year }}</td>
              <td class="text-right font-weight-medium text-primary">
                {{ formatCurrency(item.totalCollected) }}
              </td>
              <td class="text-right text-warning">
                {{ formatCurrency(item.pendingPayments) }}
              </td>
              <td class="text-right text-success">
                {{ formatCurrency(item.expectedIncome) }}
              </td>
              <td class="text-right pr-4">
                <v-tooltip location="top" text="Collection progress">
                  <template v-slot:activator="{ props }">
                    <div class="d-flex align-center justify-end" v-bind="props">
                      <span class="mr-2"
                        >{{
                          getCollectionPercentage(item.totalCollected, item.expectedIncome)
                        }}%</span
                      >
                      <v-progress-linear
                        :model-value="
                          getCollectionPercentage(item.totalCollected, item.expectedIncome)
                        "
                        color="primary"
                        height="8"
                        rounded
                        class="collection-progress"
                        bg-color="primary-lighten-5"
                        :max="100"
                      ></v-progress-linear>
                    </div>
                  </template>
                </v-tooltip>
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-grey-lighten-4" v-if="filteredEarnings.length > 0">
            <tr>
              <td class="pl-4 font-weight-bold">Total</td>
              <td class="text-right font-weight-bold text-primary">
                {{ formatCurrency(totalRevenue) }}
              </td>
              <td class="text-right font-weight-bold text-warning">
                {{ formatCurrency(totalPending) }}
              </td>
              <td class="text-right font-weight-bold text-success">
                {{ formatCurrency(totalExpected) }}
              </td>
              <td class="text-right pr-4 font-weight-bold">
                {{ getCollectionPercentage(totalRevenue, totalExpected) }}%
              </td>
            </tr>
          </tfoot>
        </v-table>
      </template>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.earnings-card {
  border-radius: 16px;
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.earnings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.earnings-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.earnings-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.collection-progress {
  width: 80px;
  border-radius: 4px;
}

.duration-filter {
  margin-right: 12px;
}

@media (max-width: 600px) {
  .collection-progress {
    width: 40px;
  }

  .duration-filter {
    max-width: 120px;
  }
}
</style>
