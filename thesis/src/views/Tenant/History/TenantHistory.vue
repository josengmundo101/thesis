<script setup>
import { ref, onMounted } from 'vue'
import TenantHistoryTable from '../History/components/TenantHistoryTable.vue'
import { supabase } from '@/utils/supabase'

// Reactive variables
const payments = ref([])
const loading = ref(true)
const error = ref(null)

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

    // Fetch payments where user_id matches
    const { data, error: fetchError } = await supabase
      .from('payment')
      .select('payment_id, amount, payment_method, payment_date, status')
      .eq('user_id', userId)
      .order('payment_date', { ascending: false })

    if (fetchError) throw fetchError

    // Update payments data
    payments.value = data.map((payment) => ({
      id: payment.payment_id,
      amount: payment.amount,
      method: payment.payment_method,
      date: payment.payment_date
        ? new Date(payment.payment_date).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'No Date Available',
      status: payment.status,
    }))
  } catch (err) {
    error.value = err.message || 'Failed to load payment history.'
  } finally {
    loading.value = false
  }
}

// Fetch payments on component mount
onMounted(() => {
  fetchTenantPayments()
})
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Payment History</h2>
        <p class="text-body-1 text-grey-lighten-1">Review your bill.</p>
      </v-col>
    </v-row>

    <v-card
      class="payment-history-card elevation-2 mt-10 fade-in delay-100"
      justify="center"
      align="center"
    >
      <v-card-title class="d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-history</v-icon>
        <span class="text-h6 font-weight-bold">My Payment History</span>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text>
        <template v-if="loading">
          <v-progress-circular indeterminate color="primary" />
        </template>

        <template v-else-if="error">
          <div class="text-center text-red font-weight-medium">
            <v-icon color="red" size="36">mdi-alert-circle-outline</v-icon>
            <p>{{ error }}</p>
          </div>
        </template>

        <template v-else>
          <TenantHistoryTable :payments="payments" />
        </template>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.payment-history-card {
  border-radius: 12px;
  overflow: hidden;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.payment-history-card:hover {
  transform: translateY(-2px);
  box-shadow: 0px 8px 18px rgba(0, 0, 0, 0.08);
}
</style>
