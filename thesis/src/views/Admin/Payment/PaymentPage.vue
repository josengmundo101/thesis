<script setup>
import { ref, computed } from 'vue'
import SearchBar from './components/SearchBar.vue'
import PaymentTable from './components/PaymentTable.vue'
import PaymentHistory from './components/PaymentHistory.vue'

// Dummy Payment Data
const payments = ref([
  { id: 1, name: 'John Doe', amount: 500, time: '10:30 AM', date: '2025-03-01', status: 'Pending' },
  {
    id: 2,
    name: 'Jane Smith',
    amount: 600,
    time: '02:15 PM',
    date: '2025-03-02',
    status: 'Pending',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    amount: 700,
    time: '11:45 AM',
    date: '2025-03-03',
    status: 'Approved',
  },
  {
    id: 4,
    name: 'Emily Davis',
    amount: 550,
    time: '09:20 AM',
    date: '2025-03-04',
    status: 'Pending',
  },
])

// Search Filter
const searchQuery = ref('')

const filteredPayments = computed(() =>
  payments.value.filter((payment) =>
    payment.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  ),
)

// Update Payment Status
const updatePaymentStatus = (id, status) => {
  const payment = payments.value.find((payment) => payment.id === id)
  if (payment) {
    payment.status = status
  }
}
</script>

<template>
  <v-container class="py-8">
    <!-- Page Header -->
    <div class="page-header">
      <h1 class="text-h4 font-weight-bold tracking-tight">Payment Management</h1>
      <p class="text-body-2 text-grey-darken-1">Track, manage, and approve tenant payments.</p>
    </div>

    <!-- Search Bar -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search by tenant name..." />
      </v-col>
    </v-row>

    <!-- Payment Table & Payment History -->
    <v-row>
      <v-col cols="12">
        <PaymentTable :payments="filteredPayments" @update-status="updatePaymentStatus" />
      </v-col>
      <v-col cols="12" class="mt-4">
        <PaymentHistory />
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
