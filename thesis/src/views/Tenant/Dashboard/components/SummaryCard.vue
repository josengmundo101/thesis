<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '@/utils/supabase'

// Reactive State
const outstandingBalance = ref(0)
const dueDate = ref('')
const paymentStatus = ref('') // New State for Status
const loading = ref(true)
const errorMessage = ref('')

// Function to fetch invoice data
const fetchOutstandingBalance = async () => {
  try {
    loading.value = true // Start loading

    // Step 0: Get the currently logged-in user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      errorMessage.value = '⚠️ No logged-in user found.'
      console.error(error)
      return
    }

    // Step 1: Fetch the user's invoice_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', user.id)
      .single()

    if (userError || !userData?.invoice_id) {
      errorMessage.value = '⚠️ No invoice found for this user.'
      console.error(userError)
      return
    }

    // Step 2: Fetch the invoice details including status
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance, due_date, status')
      .eq('invoice_id', userData.invoice_id)
      .single()

    if (invoiceError) {
      errorMessage.value = '🛑 Error fetching invoice data.'
      console.error(invoiceError)
    } else {
      // Update State
      outstandingBalance.value = invoiceData.outstanding_balance || 0
      dueDate.value = new Date(invoiceData.due_date).toLocaleDateString() || 'N/A'
      paymentStatus.value = invoiceData.status || 'Pending' // Capture Status
      console.log('✅ Data fetched:', {
        outstandingBalance: outstandingBalance.value,
        dueDate: dueDate.value,
        paymentStatus: paymentStatus.value,
      })
    }
  } catch (err) {
    errorMessage.value = '🛑 Unexpected error occurred.'
    console.error(err)
  } finally {
    loading.value = false // Stop loading
  }
}

// Real-time Update Listener
const handleTotalAmountUpdated = async () => {
  await fetchOutstandingBalance()
}

// Lifecycle Hooks
onMounted(() => {
  fetchOutstandingBalance()
  window.addEventListener('total-amount-updated', handleTotalAmountUpdated)
})

onBeforeUnmount(() => {
  window.removeEventListener('total-amount-updated', handleTotalAmountUpdated)
})
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Summary</v-card-title>
    <v-divider></v-divider>

    <!-- Loading State -->
    <v-progress-circular v-if="loading" indeterminate color="primary" class="my-5" />

    <!-- Error State -->
    <v-alert v-if="errorMessage" type="error" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <!-- Display Balance -->
    <v-list v-if="!loading && !errorMessage" density="compact">
      <v-list-item>
        <v-list-item-title>Outstanding Balance:</v-list-item-title>
        <v-list-item-subtitle class="text-h6 font-weight-bold text-error">
          ₱{{ outstandingBalance.toLocaleString() }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>Payment Due:</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold">{{ dueDate }}</v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <v-list-item-title>Status:</v-list-item-title>
        <v-list-item-subtitle>
          <v-chip
            :color="
              paymentStatus === 'Paid'
                ? 'success'
                : paymentStatus === 'Overdue'
                  ? 'error'
                  : 'warning'
            "
            class="font-weight-bold"
          >
            {{ paymentStatus }}
          </v-chip>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" variant="flat">
        <RouterLink to="/tenant/TenantPayment">Make Payment</RouterLink>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
a {
  text-decoration: none;
  color: #fff;
}
</style>
