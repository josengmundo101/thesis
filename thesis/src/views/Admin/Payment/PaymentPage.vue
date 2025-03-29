<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import SearchBar from './components/SearchBar.vue'
import PaymentTable from './components/PaymentTable.vue'
import PaymentHistory from './components/PaymentHistory.vue'

const payments = ref([])
const searchQuery = ref('')

// Fetch Payments from Supabase
const fetchPayments = async () => {
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
        users (firstname, lastname)
      `,
      )
      .order('payment_date', { ascending: false })

    if (error) throw error

    payments.value = data.map((payment) => ({
      id: payment.payment_id,
      name: `${payment.users.firstname} ${payment.users.lastname}`,
      amount: payment.amount,
      method: payment.payment_method,
      transactionId: payment.transaction_id,
      date: new Date(payment.payment_date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      status: payment.status,
    }))
  } catch (error) {
    console.error('Error fetching payments:', error.message)
  }
}

// Update Payment Status Function
const updatePaymentStatus = async (id, status) => {
  const validStatuses = ['pending', 'approved', 'rejected']

  if (!validStatuses.includes(status.toLowerCase())) {
    console.error('Invalid status value:', status)
    return
  }

  try {
    const { error } = await supabase.from('payment').update({ status }).eq('payment_id', id)

    if (error) throw error

    const payment = payments.value.find((p) => p.id === id)
    if (payment) payment.status = status

    console.log(`Payment status updated to '${status}'`)
  } catch (error) {
    console.error('Error updating payment status:', error.message)
  }
}

// Computed for Search Functionality
const filteredPayments = computed(() =>
  payments.value.filter((payment) =>
    payment.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  ),
)

// Fetch Payments on Component Mount
onMounted(fetchPayments)
</script>

<template>
  <v-container class="py-8">
    <div class="page-header">
      <h1 class="text-h4 font-weight-bold tracking-tight">Payment Management</h1>
      <p class="text-body-2 text-grey-darken-1">Track, manage, and approve tenant payments.</p>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search by tenant name..." />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <PaymentTable :payments="filteredPayments" @status-change="updatePaymentStatus" />
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
