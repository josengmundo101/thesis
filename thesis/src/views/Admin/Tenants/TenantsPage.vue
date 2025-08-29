<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'
import SearchBar from './components/SearchBar.vue'
import TenantTable from './components/TenantTable.vue'
import ViewDetails from './components/ViewDetails.vue'
import AssignRoom from './components/AssignRoom.vue'
import TenantLedger from './components/TenantLedger.vue'
import PendingTenantApproval from './components/PendingTenantsApproval.vue'
import SetTenantRates from './components/SetTenantRates.vue'

const toast = useToast()
const tenants = ref([])
const loading = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const selectedTenant = ref(null)
const detailsModalOpen = ref(false)
const assignModalOpen = ref(false)
const ITEMS_PER_PAGE = 5
const showLedger = ref(false)
const ratesModalOpen = ref(false)

const fetchTenants = async () => {
  loading.value = true
  try {
    // Fetch tenants with their invoices and payments
    const { data: tenantData, error: tenantError } = await supabase
      .from('users')
      .select(
        `
        *,
        bed_assignment (
          bed_side,
          room_id,
          rooms (
            room_number
          )
        ),
        invoices (
          invoice_id,
          total_amount,
          outstanding_balance
        ),
        payment (
          amount,
          payment_date
        )
      `,
      )
      .eq('role', 'tenant')

    if (tenantError) throw tenantError

    tenants.value = tenantData.map((tenant) => {
      // Calculate status based on TenantLedger logic
      let status = 'Unpaid'
      const invoice = tenant.invoices && tenant.invoices.length > 0 ? tenant.invoices[0] : null
      const amount_due = invoice ? invoice.total_amount || 0 : 0
      const amount_paid = tenant.payment.reduce((sum, pmt) => sum + (pmt.amount || 0), 0)
      const balance = invoice ? invoice.outstanding_balance || 0 : 0

      if (amount_paid >= amount_due && amount_due > 0) {
        status = 'Paid'
      } else if (amount_paid > 0) {
        status = 'Partial'
      }

      return {
        ...tenant,
        status,
        bed_assignment: tenant.bed_assignment.length > 0 ? tenant.bed_assignment : null,
      }
    })
    console.log('Fetched Tenants with Status:', tenants.value)
  } catch (error) {
    console.error('Error fetching tenants:', error.message)
    errorMessage.value = 'Failed to load tenants. Please try again later.'
    tenants.value = []
  } finally {
    loading.value = false
  }
}

const subscribeToTenantChanges = () => {
  supabase
    .channel('public:bed_assignment')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bed_assignment' },
      (payload) => {
        console.log('Bed assignment change:', payload)
        fetchTenants()
      },
    )
    .subscribe()
}

const subscribeToInvoiceChanges = () => {
  supabase
    .channel('public:invoices')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, (payload) => {
      console.log('Invoice change:', payload)
      fetchTenants()
    })
    .subscribe()
}

const subscribeToPaymentChanges = () => {
  supabase
    .channel('public:payment')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'payment' }, (payload) => {
      console.log('Payment change:', payload)
      fetchTenants()
    })
    .subscribe()
}

onMounted(() => {
  fetchTenants()
  subscribeToTenantChanges()
  subscribeToInvoiceChanges()
  subscribeToPaymentChanges()
})

onUnmounted(() => {
  supabase.removeAllChannels()
})

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  return tenants.value.filter((tenant) => {
    const fullName = `${tenant.firstname} ${tenant.lastname}`.toLowerCase()
    return (
      fullName.includes(searchQuery.value.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (tenant?.bed_assignment?.[0]?.rooms?.room_number &&
        tenant.bed_assignment[0].rooms.room_number
          .toLowerCase()
          .includes(searchQuery.value.toLowerCase()))
    )
  })
})

const handleViewDetails = (tenant) => {
  selectedTenant.value = tenant
  console.log('📜 Selected Tenant for Details:', selectedTenant.value)
  detailsModalOpen.value = true
}

const handleAssignRoom = (tenant) => {
  selectedTenant.value = tenant
  console.log('🏡 Assign Room to Tenant:', tenant)
  assignModalOpen.value = true
}

const handleUpdateTenant = (updatedTenant) => {
  const index = tenants.value.findIndex((t) => t.user_id === updatedTenant.user_id)
  if (index !== -1) {
    tenants.value[index] = {
      ...tenants.value[index],
      bed_assignment: [
        {
          bed_side: updatedTenant.bed_side,
          room_id: updatedTenant.room_id,
          rooms: { room_number: updatedTenant.room_number },
        },
      ],
    }
    toast.success(`✅ Room assigned to ${updatedTenant.firstname} ${updatedTenant.lastname}`)
  } else {
    toast.info('🔄 Refetching tenant list for latest data...')
    fetchTenants()
  }
}

const openLedger = (tenant) => {
  selectedTenant.value = tenant
  showLedger.value = true
}

function handleSetRates(tenant) {
  selectedTenant.value = tenant
  ratesModalOpen.value = true // ✅ FIXED: use .value instead of undefined function
}
</script>

<template>
  <v-container class="py-8">
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Tenant Management</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        View and manage all your property tenants.
      </p>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" sm="6">
        <SearchBar v-model="searchQuery" placeholder="Search tenants by name, email, or room..." />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <TenantTable
          :tenants="filteredTenants"
          :items-per-page="ITEMS_PER_PAGE"
          :page="currentPage"
          @page-change="currentPage = $event"
          @view-details="handleViewDetails"
          @assign-room="handleAssignRoom"
          @view-ledger="openLedger"
          @set-rates="handleSetRates"
        />
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12">
        <PendingTenantApproval />
      </v-col>
    </v-row>

    <v-progress-circular
      v-if="loading"
      indeterminate
      color="primary"
      size="64"
      class="my-5 mx-auto"
    ></v-progress-circular>

    <v-alert v-if="errorMessage" type="error" class="my-4">
      {{ errorMessage }}
    </v-alert>

    <TenantLedger
      :isOpen="showLedger"
      @update:isOpen="showLedger = $event"
      :tenant="selectedTenant"
    />

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

    <SetTenantRates
      :model-value="ratesModalOpen"
      :tenant="selectedTenant"
      @update:model-value="ratesModalOpen = $event"
      @rate-updated="fetchTenants"
    />
  </v-container>
</template>

<style scoped>
.dashboard-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
}

.fade-in {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeInUp 0.6s ease-out forwards;
}

.delay-50 {
  animation-delay: 50ms;
}

.delay-100 {
  animation-delay: 100ms;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
