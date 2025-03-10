<script setup>
import { ref, computed } from 'vue'
import SearchBar from './/components/SearchBar.vue'
import PaymentTable from './components/PaymentTable.vue'

// Dummy payment data
const payments = ref([
  {
    id: 1,
    name: 'John Doe',
    amount: '$500',
    time: '10:30 AM',
    date: '2025-03-01',
    status: 'Pending',
  },
  {
    id: 2,
    name: 'Jane Smith',
    amount: '$600',
    time: '02:15 PM',
    date: '2025-03-02',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    amount: '$700',
    time: '11:45 AM',
    date: '2025-03-03',
    status: 'Approved',
  },
  {
    id: 4,
    name: 'Emily Davis',
    amount: '$550',
    time: '09:20 AM',
    date: '2025-03-04',
    status: 'Pending',
  },
])

const searchQuery = ref('')

const filteredPayments = computed(() => {
  return payments.value.filter((payment) =>
    payment.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const updatePaymentStatus = (id, status) => {
  const payment = payments.value.find((payment) => payment.id === id)
  if (payment) {
    payment.status = status
  }
}
</script>

<template>
  <v-container class="py-8">
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Payment</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        Manage and track payment records.
      </p>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search by name..." />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <PaymentTable :payments="filteredPayments" @update-status="updatePaymentStatus" />
      </v-col>
    </v-row>
  </v-container>
</template>
