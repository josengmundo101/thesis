<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { supabase } from '@/utils/supabase'

const outstandingBalance = ref(0)
const dueDate = ref('')
const loading = ref(true)
const errorMessage = ref('')

// Function to fetch invoice data
const fetchInvoice = async () => {
  loading.value = true
  try {
    // Get the currently logged-in user's ID
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Fetch the user's invoice by joining users and invoices
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        invoice_id,
        invoices(total_amount, outstanding_balance, due_date)
      `,
      )
      .eq('user_id', user.id)
      .single()

    if (error) throw error
    if (data && data.invoices) {
      // Update state with fetched data
      outstandingBalance.value = data.invoices.outstanding_balance || 0
      dueDate.value = new Date(data.invoices.due_date).toLocaleDateString()
    }
  } catch (err) {
    console.error('Error fetching invoice:', err.message)
    errorMessage.value = err.message
  } finally {
    loading.value = false
  }
}

// Listen for real-time updates
const handleTotalAmountUpdated = async () => {
  await fetchInvoice() // Refetch invoice data on update
}

// Event Listeners for Real-time Update
onMounted(() => {
  fetchInvoice() // Fetch on component mount
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

    <v-progress-circular v-if="loading" indeterminate color="primary" class="my-5" />
    <v-alert v-if="errorMessage" type="error" class="mb-4">{{ errorMessage }}</v-alert>

    <v-list v-if="!loading && !errorMessage" density="compact">
      <v-list-item>
        <v-list-item-title>Outstanding Balance:</v-list-item-title>
        <v-list-item-subtitle class="text-h6 font-weight-bold text-error">
          ₱{{ outstandingBalance }}
        </v-list-item-subtitle>
      </v-list-item>
      <v-list-item>
        <v-list-item-title>Payment Due:</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold">{{ dueDate }}</v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <v-card-actions>
      <v-btn color="primary" variant="flat">
        <RouterLink to="/tenant/TenantPayment">Make Payment</RouterLink>
      </v-btn>
      <v-btn color="secondary" variant="flat">
        <RouterLink to="/tenant/TenantHistory">History</RouterLink>
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
