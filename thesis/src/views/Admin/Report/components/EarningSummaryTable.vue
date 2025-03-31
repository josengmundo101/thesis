<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

// Reactive state variables
const earnings = ref([])
const isLoading = ref(true)
const error = ref(null)

const totalRevenue = computed(() =>
  earnings.value.reduce((sum, item) => sum + item.totalCollected, 0),
)

const totalPending = computed(() =>
  earnings.value.reduce((sum, item) => sum + item.pendingPayments, 0),
)

const totalExpected = computed(() =>
  earnings.value.reduce((sum, item) => sum + item.expectedIncome, 0),
)

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
      return
    }

    // Process data into monthly summaries
    const monthlyEarnings = {}

    payments.forEach(({ amount, status, payment_date }) => {
      const date = new Date(payment_date)
      const month = date.toLocaleString('en-US', { month: 'long' })

      if (!monthlyEarnings[month]) {
        monthlyEarnings[month] = {
          month,
          totalCollected: 0,
          pendingPayments: 0,
          expectedIncome: 0,
        }
      }

      // Convert amount to number if it's not already
      const numAmount = typeof amount === 'number' ? amount : parseFloat(amount)

      monthlyEarnings[month].expectedIncome += numAmount

      if (status === 'approved') {
        monthlyEarnings[month].totalCollected += numAmount
      } else if (status === 'pending') {
        monthlyEarnings[month].pendingPayments += numAmount
      }
    })

    // Convert object to array and sort by month
    const monthOrder = [
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

    earnings.value = Object.values(monthlyEarnings).sort(
      (a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month),
    )
  } catch (err) {
    console.error('Error fetching earnings:', err.message)
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Fetch data on component mount
onMounted(fetchEarnings)

// Helper functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

const getCollectionPercentage = (collected, expected) => {
  return expected > 0 ? Math.round((collected / expected) * 100) : 0
}
</script>

<template>
  <v-card class="earnings-card" elevation="1">
    <v-card-item>
      <template v-slot:prepend>
        <v-icon color="primary" icon="mdi-finance" size="large" class="mr-2"></v-icon>
      </template>
      <v-card-title class="text-h5 font-weight-bold">Monthly Earnings Summary</v-card-title>
      <template v-slot:append>
        <v-btn variant="text" prepend-icon="mdi-printer" color="primary" size="small">
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
            <tr v-for="(item, index) in earnings" :key="index" class="earnings-row">
              <td class="pl-4 font-weight-medium">{{ item.month }}</td>
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
          <tfoot class="bg-grey-lighten-4">
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

@media (max-width: 600px) {
  .collection-progress {
    width: 40px;
  }
}
</style>
