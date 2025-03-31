<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useNotificationStore } from '@/stores/useNotificationStore'

const notificationStore = useNotificationStore()
const pendingBalances = ref([])

// Fetch data from Supabase
const fetchPendingBalances = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        invoice_id,
        total_amount,
        due_date,
        status,
        outstanding_balance,
        users:users!invoice_id(
          user_id,
          firstname,
          lastname,
          contact_number,
          bed_assignments:bed_assignment!user_id(
            assignment_id,
            bed_side,
            date_assigned,
            rooms:rooms!room_id(
              room_id,
              room_number
            )
          )
        )
      `,
      )
      .eq('status', 'pending')

    if (error) throw error

    console.log('Raw Data:', JSON.stringify(data, null, 2))

    pendingBalances.value = data.map((invoice) => {
      const user = invoice.users?.[0] || {}
      const assignment = user.bed_assignments?.[0] || {}
      const room = assignment.rooms || {}

      const daysOverdue = invoice.due_date
        ? Math.max(0, Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)))
        : 0

      return {
        id: invoice.invoice_id,
        firstname: user.firstname,
        lastname: user.lastname,
        room: room.room_number,
        bedSide: assignment.bed_side,
        dateAssigned: assignment.date_assigned
          ? new Date(assignment.date_assigned).toLocaleDateString()
          : null,
        contact: user.contact_number,
        amountDue: invoice.total_amount,
        outstandingBalance: invoice.outstanding_balance,
        dueDate: invoice.due_date
          ? new Date(invoice.due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
            })
          : null,
        status: daysOverdue > 0 ? 'overdue' : 'pending',
        daysOverdue: daysOverdue,
      }
    })

    console.log('Processed Data:', pendingBalances.value)
  } catch (err) {
    console.error('Error:', err)
  }
}

onMounted(() => {
  fetchPendingBalances()
})

// Computed totals
const totalPending = computed(() =>
  pendingBalances.value.reduce((sum, item) => sum + (item.amountDue || 0), 0),
)

const overdueCount = computed(
  () => pendingBalances.value.filter((item) => item.daysOverdue > 0).length,
)

const pendingCount = computed(() => pendingBalances.value.length)

// Formatting helpers
const formatCurrency = (value) => {
  if (!value) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'overdue':
      return 'error'
    case 'paid':
      return 'success'
    default:
      return 'grey'
  }
}

// Search and sorting
const searchQuery = ref('')
const sortBy = ref('dueDate')
const sortDesc = ref(false)

const filteredBalances = computed(() => {
  let result = [...pendingBalances.value]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (item) =>
        (item.firstname + ' ' + item.lastname).toLowerCase().includes(query) ||
        (item.room?.toString() || '').includes(query),
    )
  }

  return result.sort((a, b) => {
    const aValue = a[sortBy.value]
    const bValue = b[sortBy.value]

    if (aValue == null) return sortDesc.value ? -1 : 1
    if (bValue == null) return sortDesc.value ? 1 : -1

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDesc.value ? bValue.localeCompare(aValue) : aValue.localeCompare(bValue)
    }

    return sortDesc.value ? bValue - aValue : aValue - bValue
  })
})

const toggleSort = (column) => {
  sortDesc.value = sortBy.value === column ? !sortDesc.value : false
  sortBy.value = column
}

const getSortIcon = (column) => {
  if (sortBy.value !== column) return 'mdi-unfold-more-horizontal'
  return sortDesc.value ? 'mdi-sort-descending' : 'mdi-sort-ascending'
}

// ✅ Send Reminder Function (Triggers Notification)

const sendReminder = async () => {
  try {
    const { data: tenants, error } = await supabase
      .from('users')
      .select(
        `
        user_id,
        firstname,
        role,
        invoices ( outstanding_balance )
      `,
      )
      .eq('role', 'tenant')
      .gt('invoices.outstanding_balance', 0)

    if (error) throw error
    if (!tenants.length) return console.log('No tenants with pending balances.')

    tenants.forEach((tenant) => {
      const message = `Reminder: ${tenant.firstname}, please pay your outstanding balance.`

      console.log(`📢 Notification sent to ${tenant.firstname}: "${message}"`)

      // ✅ Add notification to store
      console.log('📢 Sending notification...')

      notificationStore.addNotification(message) // ✅ Add to Pinia store
      console.log('📢 Updated Notifications:', notificationStore.notifications) // ✅
    })
  } catch (error) {
    notificationStore.addNotification(`Reminder failed: ${error.message}`, 'error')
    console.error('Reminder error:', error)
  }
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
        <v-text-field
          v-model="searchQuery"
          placeholder="Search tenants or rooms..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          variant="outlined"
          hide-details
          single-line
        ></v-text-field>

        <v-spacer></v-spacer>

        <v-btn
          color="success"
          prepend-icon="mdi-send-check"
          variant="tonal"
          size="small"
          class="ml-2"
          @click="sendReminder"
        >
          Send Reminders
        </v-btn>
      </div>

      <!-- Table -->
      <v-table class="rounded-lg balance-table">
        <thead>
          <tr class="text-grey bg-grey-lighten-4">
            <th @click="toggleSort('firstname')" class="cursor-pointer">
              <div class="d-flex align-center">
                Tenant Name
                <v-icon size="small" class="ml-1">{{ getSortIcon('firstname') }}</v-icon>
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
          </tr>
        </thead>

        <tbody>
          <tr v-if="filteredBalances.length === 0">
            <td colspan="6" class="text-center py-4 text-grey">
              <v-icon size="large" class="mr-2">mdi-database-remove</v-icon>
              No pending balances found
            </td>
          </tr>

          <tr v-for="item in filteredBalances" :key="item.id" class="balance-row">
            <!-- Tenant Name -->
            <td class="font-weight-medium">
              <div class="d-flex align-center">
                <v-avatar size="32" color="grey-lighten-3" class="mr-2">
                  <span class="text-caption">
                    {{ (item.firstname?.[0] || '') + (item.lastname?.[0] || '') }}
                  </span>
                </v-avatar>
                <template v-if="item.firstname || item.lastname">
                  {{ item.firstname }} {{ item.lastname }}
                </template>
                <template v-else>
                  <span class="text-grey">No tenant</span>
                </template>
              </div>
            </td>

            <!-- Room Number -->
            <td>
              <template v-if="item.room">
                <v-chip size="small" color="black" variant="tonal">
                  {{ item.room }}
                  <template v-if="item.bedSide"> - Bed {{ item.bedSide }}</template>
                </v-chip>
              </template>
              <template v-else>
                <span class="text-grey">Unassigned</span>
              </template>
            </td>

            <!-- Amount Due -->
            <td class="font-weight-medium">{{ formatCurrency(item.amountDue) }}</td>

            <!-- Due Date -->
            <td>
              <div class="d-flex align-center">
                <v-icon
                  :color="item.daysOverdue > 0 ? 'error' : 'warning'"
                  size="small"
                  class="mr-1"
                >
                  {{ item.daysOverdue > 0 ? 'mdi-calendar-alert' : 'mdi-calendar-clock' }}
                </v-icon>
                {{ item.dueDate || '—' }}
                <span v-if="item.daysOverdue > 0" class="text-caption text-error ml-1"
                  >({{ item.daysOverdue }}d)</span
                >
              </div>
            </td>

            <!-- Status -->
            <td>
              <v-chip
                size="small"
                :color="getStatusColor(item.status)"
                variant="tonal"
                :prepend-icon="item.status === 'overdue' ? 'mdi-alert-circle' : 'mdi-clock-outline'"
              >
                {{ item.status }}
              </v-chip>
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
