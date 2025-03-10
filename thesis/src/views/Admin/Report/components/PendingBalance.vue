<script setup>
import { ref, computed } from 'vue'

const pendingBalances = ref([
  {
    id: 1,
    name: 'John Doe',
    room: 101,
    amountDue: 5000,
    dueDate: 'Jan 31',
    status: 'Pending',
    days: 5,
  },
  {
    id: 2,
    name: 'Jane Smith',
    room: 204,
    amountDue: 2500,
    dueDate: 'Jan 25',
    status: 'Overdue',
    days: 12,
  },
  {
    id: 3,
    name: 'Michael Johnson',
    room: 305,
    amountDue: 3800,
    dueDate: 'Feb 5',
    status: 'Pending',
    days: 10,
  },
  {
    id: 4,
    name: 'Emily Williams',
    room: 102,
    amountDue: 4200,
    dueDate: 'Jan 20',
    status: 'Overdue',
    days: 17,
  },
  {
    id: 5,
    name: 'Robert Brown',
    room: 208,
    amountDue: 1900,
    dueDate: 'Feb 10',
    status: 'Pending',
    days: 15,
  },
])

const totalPending = computed(() =>
  pendingBalances.value.reduce((sum, item) => sum + item.amountDue, 0),
)

const overdueCount = computed(
  () => pendingBalances.value.filter((item) => item.status === 'Overdue').length,
)

const pendingCount = computed(
  () => pendingBalances.value.filter((item) => item.status === 'Pending').length,
)

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

const getStatusColor = (status) => {
  return status === 'Overdue' ? 'error' : 'warning'
}

const searchQuery = ref('')
const sortBy = ref('dueDate')
const sortDesc = ref(false)

const filteredBalances = computed(() => {
  let result = [...pendingBalances.value]

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (item) => item.name.toLowerCase().includes(query) || item.room.toString().includes(query),
    )
  }

  // Apply sorting
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
</script>

<template>
  <v-card class="pending-balance-card elevation-1" rounded="lg">
    <v-card-item>
      <template v-slot:prepend>
        <v-icon color="error" icon="mdi-clock-alert" size="large" class="mr-2"></v-icon>
      </template>
      <v-card-title class="text-h5 font-weight-bold">Pending Balances</v-card-title>
      <template v-slot:append>
        <v-btn variant="text" prepend-icon="mdi-printer" color="grey-darken-1" size="small">
          Print
        </v-btn>
      </template>
    </v-card-item>

    <v-divider class="mx-4"></v-divider>

    <v-card-text>
      <!-- Stats overview -->
      <div class="d-flex flex-wrap gap-4 my-4">
        <v-sheet
          rounded="xl"
          elevation="1"
          class="pa-4 flex-grow-1 bg-primary-lighten-5 d-flex align-center"
        >
          <v-avatar color="primary" class="mr-3">
            <v-icon color="white">mdi-currency-usd</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">Total Outstanding</div>
            <div class="text-h5 font-weight-bold">{{ formatCurrency(totalPending) }}</div>
          </div>
        </v-sheet>

        <v-sheet
          rounded="xl"
          elevation="1"
          class="pa-4 flex-grow-1 bg-error-lighten-5 d-flex align-center"
        >
          <v-avatar color="error" class="mr-3">
            <v-icon color="white">mdi-alert-circle</v-icon>
          </v-avatar>
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
          <v-avatar color="warning" class="mr-3">
            <v-icon color="white">mdi-timer-sand</v-icon>
          </v-avatar>
          <div>
            <div class="text-caption text-medium-emphasis">Pending Payments</div>
            <div class="text-h5 font-weight-bold">{{ pendingCount }}</div>
          </div>
        </v-sheet>
      </div>

      <!-- Search and actions -->
      <div class="d-flex align-center mb-4">
        <v-spacer></v-spacer>

        <v-btn
          color="success"
          prepend-icon="mdi-send-check"
          variant="tonal"
          size="small"
          class="ml-2"
        >
          Send Reminders
        </v-btn>
      </div>

      <!-- Table -->
      <v-table class="rounded-lg balance-table">
        <thead>
          <tr class="text-grey bg-grey-lighten-4">
            <th @click="toggleSort('name')" class="cursor-pointer">
              <div class="d-flex align-center">
                Tenant Name
                <v-icon size="small" class="ml-1">{{ getSortIcon('name') }}</v-icon>
              </div>
            </th>
            <th @click="toggleSort('room')" class="cursor-pointer">
              <div class="d-flex align-center">
                Room #
                <v-icon size="small" class="ml-1">{{ getSortIcon('room') }}</v-icon>
              </div>
            </th>
            <th @click="toggleSort('amountDue')" class="cursor-pointer">
              <div class="d-flex align-center">
                Amount Due
                <v-icon size="small" class="ml-1">{{ getSortIcon('amountDue') }}</v-icon>
              </div>
            </th>
            <th @click="toggleSort('dueDate')" class="cursor-pointer">
              <div class="d-flex align-center">
                Due Date
                <v-icon size="small" class="ml-1">{{ getSortIcon('dueDate') }}</v-icon>
              </div>
            </th>
            <th @click="toggleSort('status')" class="cursor-pointer">
              <div class="d-flex align-center">
                Status
                <v-icon size="small" class="ml-1">{{ getSortIcon('status') }}</v-icon>
              </div>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredBalances" :key="item.id" class="balance-row">
            <td class="font-weight-medium">
              <div class="d-flex align-center">
                <v-avatar size="32" color="grey-lighten-3" class="mr-2">
                  <span class="text-caption">{{
                    item.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                  }}</span>
                </v-avatar>
                {{ item.name }}
              </div>
            </td>
            <td>
              <v-chip
                size="small"
                color="grey-lighten-3"
                variant="tonal"
                class="font-weight-medium"
              >
                {{ item.room }}
              </v-chip>
            </td>
            <td class="font-weight-medium">{{ formatCurrency(item.amountDue) }}</td>
            <td>
              <div class="d-flex align-center">
                <v-icon :color="getStatusColor(item.status)" size="small" class="mr-1">
                  {{ item.status === 'Overdue' ? 'mdi-calendar-alert' : 'mdi-calendar-clock' }}
                </v-icon>
                {{ item.dueDate }}
              </div>
            </td>
            <td>
              <v-chip
                size="small"
                :color="getStatusColor(item.status)"
                variant="tonal"
                :prepend-icon="item.status === 'Overdue' ? 'mdi-alert-circle' : 'mdi-clock-outline'"
              >
                {{ item.status }}
                <span v-if="item.days" class="ml-1 text-caption">({{ item.days }} days)</span>
              </v-chip>
            </td>
            <td>
              <div class="d-flex">
                <v-btn size="small" icon variant="text" color="primary">
                  <v-icon size="small">mdi-message-text-outline</v-icon>
                  <v-tooltip activator="parent" location="top">Send reminder</v-tooltip>
                </v-btn>
                <v-btn size="small" icon variant="text" color="success">
                  <v-icon size="small">mdi-cash-register</v-icon>
                  <v-tooltip activator="parent" location="top">Record payment</v-tooltip>
                </v-btn>
                <v-btn size="small" icon variant="text" color="grey">
                  <v-icon size="small">mdi-dots-vertical</v-icon>
                  <v-tooltip activator="parent" location="top">More options</v-tooltip>
                </v-btn>
              </div>
            </td>
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
