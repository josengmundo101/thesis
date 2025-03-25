<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

// Reactive State
const pendingBalances = ref([])
const loading = ref(true)
const errorMessage = ref('')

// 🟢 Fetch Pending Balances (Join invoices & users)
const fetchPendingBalances = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    // Fetch data with join on users
    const { data, error } = await supabase.from('invoices').select(`
        invoice_id,
        total_amount,
        outstanding_balance,
        due_date,
        status,
        user_id,
        users (firstname, lastname, room_id)
      `)

    if (error) throw error

    // Map through data to format the result
    pendingBalances.value = data.map((item) => ({
      id: item.invoice_id,
      name: `${item.users.firstname} ${item.users.lastname}`,
      room: item.users.room_id || 'N/A', // Adjust this based on your schema
      amountDue: item.outstanding_balance,
      dueDate: new Date(item.due_date).toLocaleDateString(),
      status: item.status,
      days: calculateOverdueDays(item.due_date),
    }))
  } catch (error) {
    console.error('Error fetching data:', error.message)
    errorMessage.value = error.message
  } finally {
    loading.value = false
  }
}

// 🟢 Function to calculate overdue days
const calculateOverdueDays = (dueDate) => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = today - due
  return diffTime > 0 ? Math.floor(diffTime / (1000 * 60 * 60 * 24)) : 0
}

// 🟢 Total Outstanding
const totalPending = computed(() =>
  pendingBalances.value.reduce((sum, item) => sum + item.amountDue, 0),
)

// 🟢 Count Overdue
const overdueCount = computed(
  () => pendingBalances.value.filter((item) => item.status === 'Overdue').length,
)

// 🟢 Count Pending
const pendingCount = computed(
  () => pendingBalances.value.filter((item) => item.status === 'Pending').length,
)

// 🟢 Handle Sorting
const searchQuery = ref('')
const sortBy = ref('dueDate')
const sortDesc = ref(false)

const filteredBalances = computed(() => {
  let result = [...pendingBalances.value]

  // Search Filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (item) => item.name.toLowerCase().includes(query) || item.room.toString().includes(query),
    )
  }

  // Sorting
  result.sort((a, b) => {
    let aValue = a[sortBy.value]
    let bValue = b[sortBy.value]

    if (typeof aValue === 'string') {
      return sortDesc.value ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    } else {
      return sortDesc.value ? bValue - aValue : aValue - bValue
    }
  })
  return result
})

// Sorting Function
const toggleSort = (column) => {
  if (sortBy.value === column) {
    sortDesc.value = !sortDesc.value
  } else {
    sortBy.value = column
    sortDesc.value = false
  }
}

const getSortIcon = (column) => {
  if (sortBy.value !== column) return 'mdi-unfold-more-horizontal'
  return sortDesc.value ? 'mdi-sort-descending' : 'mdi-sort-ascending'
}

// Fetch data on mount
onMounted(() => {
  fetchPendingBalances()
})
</script>

<template>
  <v-card class="pending-balance-card elevation-1" rounded="lg">
    <v-card-title class="text-h5 font-weight-bold">Pending Balances</v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-progress-circular v-if="loading" indeterminate color="primary" />
      <v-alert v-if="errorMessage" type="error">{{ errorMessage }}</v-alert>

      <!-- Stats Overview -->
      <div v-if="!loading && !errorMessage" class="d-flex flex-wrap gap-4 my-4">
        <v-sheet
          rounded="xl"
          elevation="1"
          class="pa-4 flex-grow-1 bg-primary-lighten-5 d-flex align-center"
        >
          <div>
            <div class="text-caption text-medium-emphasis">Total Outstanding</div>
            <div class="text-h5 font-weight-bold">₱{{ totalPending }}</div>
          </div>
        </v-sheet>

        <v-sheet
          rounded="xl"
          elevation="1"
          class="pa-4 flex-grow-1 bg-error-lighten-5 d-flex align-center"
        >
          <div>
            <div class="text-caption text-medium-emphasis">Overdue Payments</div>
            <div class="text-h5 font-weight-bold">{{ overdueCount }}</div>
          </div>
        </v-sheet>

        <v-sheet
          rounded="xl"
          elevation="1"
          class="pa-4 flex-grow-1 bg-warning-lighten-5 d-flex align-center"
        >
          <div>
            <div class="text-caption text-medium-emphasis">Pending Payments</div>
            <div class="text-h5 font-weight-bold">{{ pendingCount }}</div>
          </div>
        </v-sheet>
      </div>

      <!-- Table -->
      <v-table v-if="!loading && !errorMessage" class="rounded-lg balance-table">
        <thead>
          <tr>
            <th @click="toggleSort('name')">Tenant Name</th>
            <th @click="toggleSort('room')">Room #</th>
            <th @click="toggleSort('amountDue')">Amount Due</th>
            <th @click="toggleSort('dueDate')">Due Date</th>
            <th @click="toggleSort('status')">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredBalances" :key="item.id">
            <td>{{ item.name }}</td>
            <td>{{ item.room }}</td>
            <td>₱{{ item.amountDue }}</td>
            <td>{{ item.dueDate }}</td>
            <td>{{ item.status }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pending-balance-card {
  border-radius: 16px;
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.pending-balance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.12) !important;
}

.balance-table {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.balance-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: background-color 0.2s;
}

.balance-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  background-color: rgba(0, 0, 0, 0.03);
}
</style>
