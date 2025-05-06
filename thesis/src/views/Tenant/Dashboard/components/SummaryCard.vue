<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useUtilityStore } from '@/stores/useUtilityStore'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const store = useUtilityStore()
const router = useRouter()
const toast = useToast()
const invoiceData = ref(null)
const isLoading = ref(true)

const fetchInvoice = async () => {
  try {
    isLoading.value = true
    if (store.invoiceId) {
      invoiceData.value = await store.fetchInvoiceData(store.invoiceId)
      console.log('✅ SummaryCard fetched invoice:', {
        outstanding_balance: invoiceData.value?.outstanding_balance,
        arrears: invoiceData.value?.arrears,
        prepaid_balance: invoiceData.value?.prepaid_balance,
        due_date: invoiceData.value?.due_date,
      })
    } else {
      console.warn('⚠️ No invoiceId in store for SummaryCard')
      toast.error('No invoice assigned. Please try again.')
    }
  } catch (error) {
    console.error('⚠️ Error fetching invoice in SummaryCard:', error.message)
    toast.error('Failed to load invoice data: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

const status = computed(() => {
  if (!invoiceData.value) return 'Loading'
  if (invoiceData.value.prepaid_balance > 0 && invoiceData.value.outstanding_balance === 0) {
    return 'Prepaid'
  }
  if (invoiceData.value.outstanding_balance > 0 || invoiceData.value.arrears > 0) {
    return 'Overdue'
  }
  return 'Current'
})

const statusColor = computed(() => {
  if (status.value === 'Prepaid') return 'teal'
  if (status.value === 'Overdue') return 'deep-orange'
  if (status.value === 'Loading') return 'grey'
  return 'indigo'
})

const formattedDueDate = computed(() => {
  if (!invoiceData.value?.due_date) return 'N/A'
  return new Date(invoiceData.value.due_date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
})

const handlePaymentProcessed = (event) => {
  console.log('🔔 SummaryCard received payment-processed:', event.detail)
  fetchInvoice()
}

const navigateToPayment = () => {
  console.log('🔗 Navigating to /tenant/TenantPayment')
  router.push('/tenant/TenantPayment')
}

onMounted(async () => {
  await fetchInvoice()
  window.addEventListener('payment-processed', handlePaymentProcessed)
})

onUnmounted(() => {
  window.removeEventListener('payment-processed', handlePaymentProcessed)
})
</script>

<template>
  <v-card elevation="2" class="hover-scale fade-in delay-100 rounded-xl debug-visible">
    <v-card-title class="text-h6 font-weight-bold">Payment Summary</v-card-title>
    <v-divider></v-divider>
    <v-card-text v-if="!isLoading && invoiceData">
      <v-list>
        <v-list-item class="py-2">
          <div class="d-flex align-center w-100 justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="deep-orange" class="mr-2">mdi-alert-circle</v-icon>
              <span class="font-weight-medium">Outstanding Balance</span>
            </div>
            <span class="font-weight-bold text-deep-orange">
              ₱{{ (invoiceData.outstanding_balance || 0).toLocaleString() }}
            </span>
          </div>
        </v-list-item>

        <v-list-item class="py-2">
          <div class="d-flex align-center w-100 justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="red darken-1" class="mr-2">mdi-clock-alert</v-icon>
              <span class="font-weight-medium">Arrears</span>
            </div>
            <span class="font-weight-bold text-red-darken-1">
              ₱{{ (invoiceData.arrears || 0).toLocaleString() }}
            </span>
          </div>
        </v-list-item>

        <v-list-item class="py-2">
          <div class="d-flex align-center w-100 justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="green darken-1" class="mr-2">mdi-cash-plus</v-icon>
              <span class="font-weight-medium">Prepaid Balance</span>
            </div>
            <span class="font-weight-bold text-green-darken-1">
              ₱{{ (invoiceData.prepaid_balance || 0).toLocaleString() }}
            </span>
          </div>
        </v-list-item>

        <v-list-item class="py-2">
          <div class="d-flex align-center w-100 justify-space-between">
            <div class="d-flex align-center">
              <v-icon color="blue darken-1" class="mr-2">mdi-calendar</v-icon>
              <span class="font-weight-medium">Due Date</span>
            </div>
            <span class="font-weight-bold text-blue-darken-1">{{ formattedDueDate }}</span>
          </div>
        </v-list-item>

        <v-list-item class="py-2">
          <div class="d-flex align-center w-100 justify-space-between">
            <div class="d-flex align-center">
              <v-icon :color="statusColor" class="mr-2">mdi-information</v-icon>
              <span class="font-weight-medium">Status</span>
            </div>
            <span class="font-weight-bold" :class="`text-${statusColor}`">{{ status }}</span>
          </div>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-text v-else>
      <v-progress-circular indeterminate color="primary" />
      <p>Loading invoice data...</p>
    </v-card-text>
    <v-card-actions>
      <v-btn
        color="primary"
        variant="elevated"
        block
        @click="navigateToPayment"
        :disabled="isLoading"
      >
        Make Payment
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.debug-visible {
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
  min-height: 20px;
}
.hover-scale {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s;
}
.hover-scale:hover {
  transform: translateY(-3px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);
}
.fade-in {
  animation: fadeIn 0.5s ease-in;
}
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
