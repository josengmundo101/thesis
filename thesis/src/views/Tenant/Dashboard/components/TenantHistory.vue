<!-- PaymentHistory.vue -->
<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/utils/supabase'

// Reactive variables
const payments = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const itemsPerPage = 5 // Set to show 5 items per page

// Get the current logged-in user's ID
const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user ? user.id : null
}

// Fetch payments from Supabase
const fetchTenantPayments = async () => {
  loading.value = true
  error.value = null

  try {
    const userId = await getCurrentUser()
    if (!userId) throw new Error('User not authenticated.')

    const { data, error: fetchError } = await supabase
      .from('payment')
      .select('payment_id, amount, payment_method, payment_date, status')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false })

    if (fetchError) throw fetchError

    payments.value = data.map((payment) => ({
      id: payment.payment_id,
      amount: payment.amount,
      method: payment.payment_method || 'Unknown', // Fallback for null values
      date: payment.payment_date
        ? new Date(payment.payment_date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'No Date Available',
      status: payment.status || 'Pending', // Fallback for null values
    }))
  } catch (err) {
    error.value = err.message || 'Failed to load payment history.'
  } finally {
    loading.value = false
  }
}

// Computed properties for pagination
const paginatedPayments = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return payments.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(payments.value.length / itemsPerPage)
})

// Navigation methods
const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    case 'pending':
      return 'warning'
    default:
      return 'grey' // Fallback for unexpected statuses
  }
}

// Fetch payments on component mount
onMounted(() => {
  fetchTenantPayments()
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(value || 0) // Fallback for null/undefined
}
</script>

<template>
  <v-card class="payment-history-card elevation-2 mt-10 fade-in delay-100">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-history</v-icon>
      <span class="text-h6 font-weight-bold">My Payment History</span>
    </v-card-title>

    <v-card-text>
      <!-- Loading State -->
      <v-progress-circular
        v-if="loading"
        indeterminate
        color="primary"
        size="32"
        class="my-4 mx-auto d-block"
      />

      <!-- Error State -->
      <v-alert v-if="error && !loading" type="error" class="my-4">
        {{ error }}
      </v-alert>

      <!-- Payments Table or Empty State -->
      <div v-if="!loading && !error">
        <v-table v-if="paginatedPayments.length > 0" class="modern-table fade-in delay-100">
          <thead>
            <tr>
              <th class="text-left">Amount Paid</th>
              <th class="text-left">Payment Method</th>
              <th class="text-left">Payment Date</th>
              <th class="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payment in paginatedPayments" :key="payment.id">
              <td>{{ formatCurrency(payment.amount) }}</td>
              <td>{{ payment.method }}</td>
              <td>{{ payment.date }}</td>
              <td>
                <v-chip :color="getStatusColor(payment.status)" small variant="tonal">
                  {{ payment.status }}
                </v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>

        <div v-else class="no-history text-center py-4">
          <v-icon size="36" color="grey">mdi-alert-circle-outline</v-icon>
          <p class="text-grey">No payment history available.</p>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="pa-4 d-flex justify-center align-center">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            :disabled="currentPage === 1"
            @click="prevPage"
          />

          <div class="mx-2 d-flex gap-1">
            <v-btn
              v-for="page in totalPages"
              :key="page"
              variant="text"
              :color="currentPage === page ? 'primary' : 'grey'"
              size="small"
              @click="goToPage(page)"
            >
              {{ page }}
            </v-btn>
          </div>

          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.payment-history-card {
  border-radius: 12px;
  overflow: hidden;
}

.modern-table {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.no-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.gap-1 {
  gap: 4px; /* Adjust spacing between pagination buttons */
}
</style>
