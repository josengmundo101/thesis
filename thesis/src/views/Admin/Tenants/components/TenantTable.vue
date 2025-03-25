<script setup>
import { defineProps, computed, ref, defineEmits, watch } from 'vue'

// Define props
const props = defineProps({
  tenants: {
    type: Array,
    required: true,
    default: () => [],
  },
  page: {
    type: Number,
    required: true,
    default: 1,
  },
  itemsPerPage: {
    type: Number,
    required: true,
    default: 5,
  },
})

// Emits for actions
const emit = defineEmits(['pageChange', 'viewDetails', 'assignRoom'])

// Local page state (avoid direct prop mutation)
const pageNumber = ref(props.page)

// Sync local page state with prop changes
watch(
  () => props.page,
  (newPage) => {
    pageNumber.value = newPage
  },
)

// Compute paginated tenants
const paginatedTenants = computed(() => {
  if (!props.tenants || props.tenants.length === 0) {
    console.warn('⚠️ No tenant data found!') // Debugging check
    return []
  }
  const startIndex = (pageNumber.value - 1) * props.itemsPerPage
  return props.tenants.slice(startIndex, startIndex + props.itemsPerPage)
})

// Compute total pages
const totalPages = computed(() => Math.ceil(props.tenants.length / props.itemsPerPage))

// Handle pagination change
const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    pageNumber.value = newPage
    emit('pageChange', newPage)
  }
}

// Helper to get room details
const getRoomDetails = (tenant) => {
  const bedAssignment = tenant?.bed_assignment?.[0] || null // Access first assignment
  if (!bedAssignment) return 'Not assigned'

  const roomNumber = bedAssignment?.rooms?.room_number || 'N/A'
  const bedSide = bedAssignment?.bed_side || 'N/A'
  return `Room ${roomNumber} — ${bedSide.charAt(0).toUpperCase() + bedSide.slice(1)}`
}
</script>

<template>
  <v-card elevation="2" class="fade-in delay-100">
    <v-table v-if="paginatedTenants.length > 0">
      <thead>
        <tr>
          <th class="text-left">First Name</th>
          <th class="text-left">Last Name</th>
          <th class="text-left">Email</th>
          <th class="text-left">Room Assignment</th>
          <th class="text-left">Status</th>
          <th class="text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="tenant in paginatedTenants" :key="tenant.user_id">
          <td>{{ tenant.firstname }}</td>
          <td>{{ tenant.lastname }}</td>
          <td>{{ tenant.email }}</td>
          <td>
            <span v-if="tenant.bed_assignment">
              {{ getRoomDetails(tenant) }}
            </span>
            <span v-else class="text-grey-darken-1 italic">Not assigned</span>
          </td>
          <td>
            <v-chip :color="tenant.status === 'Paid' ? 'green' : 'orange'" small>
              {{ tenant.status }}
            </v-chip>
          </td>
          <td>
            <v-btn size="small" variant="text" color="primary" @click="emit('viewDetails', tenant)">
              <v-icon left>mdi-eye</v-icon> View
            </v-btn>
            <v-btn
              size="small"
              variant="outlined"
              color="secondary"
              @click="emit('assignRoom', tenant)"
            >
              <v-icon left>mdi-home</v-icon> Assign
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Show a message if no tenants exist -->
    <v-alert v-else type="info" variant="outlined" class="my-4">
      No tenants found. Try adding some data.
    </v-alert>

    <!-- Pagination -->
    <v-container v-if="totalPages > 1" class="d-flex justify-space-between align-center">
      <p class="text-body-2">
        Showing <strong>{{ (pageNumber - 1) * itemsPerPage + 1 }}</strong> to
        <strong>{{ Math.min(pageNumber * itemsPerPage, props.tenants.length) }}</strong> of
        <strong>{{ props.tenants.length }}</strong> results
      </p>
      <v-btn-toggle variant="outlined">
        <v-btn :disabled="pageNumber === 1" @click="changePage(pageNumber - 1)">
          <v-icon>mdi-chevron-left</v-icon> Prev
        </v-btn>
        <v-btn :disabled="pageNumber === totalPages" @click="changePage(pageNumber + 1)">
          Next <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </v-btn-toggle>
    </v-container>
  </v-card>
</template>

<style scoped>
.v-chip {
  font-size: 12px;
  font-weight: 500;
}

.text-grey-darken-1 {
  color: #757575;
}

.v-table tr th {
  font-weight: bold;
  text-transform: uppercase;
}
</style>
