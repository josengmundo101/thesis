<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import SearchBar from './components/SearchBar.vue'
import PaymentTable from './components/PaymentTable.vue'
import PaymentHistory from './components/PaymentHistory.vue'

const payments = ref([])
const searchQuery = ref('')
const loading = ref(false)

const fetchPayments = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('payment')
      .select(
        `
        payment_id,
        amount,
        payment_method,
        transaction_id,
        payment_date,
        status,
        invoice_id,
        user_id,
        users(firstname,lastname,custom_id)
        `,
      )
      .order('payment_date', { ascending: false })

    if (error) throw error

    payments.value = data.map((payment) => {
      const user = payment.users || { firstname: 'Unknown', lastname: 'User', custom_id: null }
      return {
        id: payment.payment_id,
        name: `${user.firstname} ${user.lastname}`,
        amount: payment.amount,
        method: payment.payment_method,
        transactionId: payment.transaction_id,
        date: new Date(payment.payment_date).toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
        status: payment.status || 'pending',
        invoice_id: payment.invoice_id,
        user_id: payment.user_id,
        custom_id: user.custom_id,
      }
    })

    console.log('Fetched Payments:', payments.value)
  } catch (error) {
    console.error('Error fetching payments:', error.message)
  } finally {
    loading.value = false
  }
}

const updatePaymentStatus = async (payment) => {
  console.log('🛑 Received Payment Object:', payment)

  const validStatuses = ['pending', 'approved', 'rejected']

  if (!payment || !validStatuses.includes(payment.action.toLowerCase())) {
    console.error('❌ Invalid or missing status:', payment.action)
    return
  }

  try {
    const { error: paymentError } = await supabase
      .from('payment')
      .update({ status: payment.action })
      .eq('payment_id', payment.payment_id)

    if (paymentError) throw paymentError

    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({ status: payment.action })
      .eq('invoice_id', payment.invoice_id)

    if (invoiceError) throw invoiceError

    await fetchPayments()

    console.log(`✅ Payment & Invoice status updated to '${payment.action}'`)
  } catch (error) {
    console.error('❌ Error updating status:', error.message)
  }
}

const filteredPayments = computed(() =>
  payments.value.filter((payment) =>
    payment.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  ),
)

const pendingCount = computed(
  () => payments.value.filter((payment) => payment.status === 'pending').length,
)

// Real-time subscription for new payments
let subscription = null
onMounted(() => {
  fetchPayments()

  subscription = supabase
    .channel('payment-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'payment',
      },
      async (payload) => {
        const newPayment = payload.new
        const { data: user, error } = await supabase
          .from('users')
          .select('firstname,lastname,custom_id')
          .eq('user_id', newPayment.user_id)
          .single()

        if (error) {
          console.error('Error fetching user for new payment:', error)
          return
        }

        const userData = user || { firstname: 'Unknown', lastname: 'User', custom_id: null }
        payments.value.unshift({
          id: newPayment.payment_id,
          name: `${userData.firstname} ${userData.lastname}`,
          amount: newPayment.amount,
          method: newPayment.payment_method,
          transactionId: newPayment.transaction_id,
          date: new Date(newPayment.payment_date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          status: newPayment.status || 'pending',
          invoice_id: newPayment.invoice_id,
          user_id: newPayment.user_id, // Ensure this is the UUID
          custom_id: userData.custom_id,
        })
        console.log('New Payment Added (Real-time):', payments.value[0])
      },
    )
    .subscribe()
})

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
})
</script>

<template>
  <v-container class="py-8">
    <div class="page-header">
      <h1 class="text-h4 font-weight-bold tracking-tight">Payment Management</h1>
      <p class="text-body-2 text-grey-darken-1">Track, manage, and approve tenant payments.</p>
    </div>

    <v-row class="mb-4" align="center">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search by tenant name..." />
      </v-col>
      <v-col cols="12" sm="6" class="text-right">
        <v-btn
          color="primary"
          variant="tonal"
          @click="fetchPayments"
          :loading="loading"
          :disabled="loading"
        >
          <v-icon left>mdi-refresh</v-icon>
          Refresh
          <v-badge v-if="pendingCount > 0" :content="pendingCount" color="red" class="ml-2" />
        </v-btn>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-skeleton-loader
          v-if="loading"
          type="table-thead, table-tbody"
          class="elevation-2"
        ></v-skeleton-loader>
        <PaymentTable v-else :payments="filteredPayments" @status-change="updatePaymentStatus" />
      </v-col>

      <v-col cols="12" class="mt-4">
        <PaymentHistory :payments="payments" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  animation: fadeInDown 0.5s ease-in-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
