<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import SearchBar from './components/SearchBar.vue'
import TenantTable from './components/TenantTable.vue'
import ViewDetails from './components/ViewDetails.vue'
import AssignRoom from './components/AssignRoom.vue'

const toast = useToast()

// Tenant data
const tenants = ref([
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    room: '101 - Garden View',
    status: 'Paid',
    address: '123 Main Street',
    contactNumber: '(555) 123-4567',
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    room: '',
    status: 'Pending',
    address: '456 Oak Avenue',
    contactNumber: '(555) 987-6543',
  },
  {
    id: 3,
    name: 'Robert Johnson',
    email: 'robert@example.com',
    room: '202 - Pool View',
    status: 'Paid',
    address: '789 Pine Road',
    contactNumber: '(555) 456-7890',
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily@example.com',
    room: '301 - Ocean View',
    status: 'Paid',
    address: '321 Cedar Lane',
    contactNumber: '(555) 234-5678',
  },
  {
    id: 5,
    name: 'Michael Wilson',
    email: 'michael@example.com',
    room: '',
    status: 'Pending',
    address: '654 Maple Street',
    contactNumber: '(555) 876-5432',
  },
])

const searchQuery = ref('')
const currentPage = ref(1)
const selectedTenant = ref(null)
const detailsModalOpen = ref(false)
const assignModalOpen = ref(false)
const loading = ref(true)
const ITEMS_PER_PAGE = 5

// Simulated loading effect
onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 600)
})

// Computed property for filtered tenants
const filteredTenants = computed(() => {
  return tenants.value.filter(
    (tenant) =>
      tenant.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (tenant.room && tenant.room.toLowerCase().includes(searchQuery.value.toLowerCase())),
  )
})

// Handlers for modals
const handleViewDetails = (tenant) => {
  selectedTenant.value = tenant
  detailsModalOpen.value = true
}

const handleAssignRoom = (tenant) => {
  selectedTenant.value = tenant
  assignModalOpen.value = true
}

const handleUpdateTenant = (updatedTenant) => {
  const index = tenants.value.findIndex((t) => t.id === updatedTenant.id)
  if (index !== -1) {
    tenants.value[index] = updatedTenant
    toast.success(`Room assigned to ${updatedTenant.name}`)
  }
}
</script>

<template>
  <v-container class="py-8">
    <!-- Page Header -->
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Tenant Management</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        View and manage all your property tenants.
      </p>
    </div>

    <!-- Search Bar -->
    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search tenants by name, email, or room..." />
      </v-col>
    </v-row>

    <!-- Tenant Table -->
    <v-row>
      <v-col>
        <TenantTable
          :tenants="filteredTenants"
          :items-per-page="ITEMS_PER_PAGE"
          :current-page="currentPage"
          @page-change="currentPage = $event"
          @view-details="handleViewDetails"
          @assign-room="handleAssignRoom"
        />
      </v-col>
    </v-row>

    <!-- Modals -->
    <ViewDetails
      :model-value="detailsModalOpen"
      @update:model-value="detailsModalOpen = $event"
      :tenant="selectedTenant"
    />
    <AssignRoom
      :model-value="assignModalOpen"
      @update:model-value="assignModalOpen = $event"
      :tenant="selectedTenant"
      @room-assigned="handleUpdateTenant"
    />
  </v-container>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
