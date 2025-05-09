<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
import { ref, onMounted, watch, defineProps } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'

const props = defineProps({
  refreshKey: {
    type: Number,
    required: true,
  },
})

const store = useUtilityStore()
const outstandingBalance = ref(0)
const arrears = ref(0)
const prepaidBalance = ref(0)
const totalPayments = ref(0)
const currentTotal = ref(0)
const grandTotal = ref(0)
const isLoading = ref(false)
const toast = useToast()
const emit = defineEmits(['update-total'])

const fetchData = async () => {
  isLoading.value = true
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('No user is currently logged in.')
    console.log('BillingSummary - Auth User ID:', user.id)

    // Fetch or create invoice_id via store
    await store.fetchInvoiceId()
    if (!store.invoiceId) {
      throw new Error('No invoice assigned for user.')
    }
    console.log('BillingSummary - Invoice ID:', store.invoiceId)

    // Fetch invoice data
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance, arrears, prepaid_balance')
      .eq('invoice_id', store.invoiceId)
      .single()

    if (invoiceError) throw invoiceError
    outstandingBalance.value = Number(invoiceData?.outstanding_balance) || 0
    arrears.value = Number(invoiceData?.arrears) || 0
    prepaidBalance.value = Number(invoiceData?.prepaid_balance) || 0
    console.log('BillingSummary - Invoice Data:', {
      outstandingBalance: outstandingBalance.value,
      arrears: arrears.value,
      prepaidBalance: prepaidBalance.value,
    })

    // Fetch total payments
    const { data: paymentData, error: paymentError } = await supabase
      .from('payment')
      .select('amount')
      .eq('invoice_id', store.invoiceId)
      .eq('status', 'approved')

    if (paymentError) throw paymentError
    totalPayments.value = paymentData.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
    console.log('BillingSummary - Total Payments:', totalPayments.value)

    // Ensure settings and tenant rates are fetched
    await store.fetchSettings()
    console.log('BillingSummary - Settings:', {
      rent: store.rent,
      electricity: store.electricity,
      water: store.water,
      wifi: store.wifi,
    })
    await store.fetchTenantRates(user.id)
    console.log('BillingSummary - Tenant Rates:', store.tenantRates)
    console.log('BillingSummary - Effective Rates:', store.effectiveRates)
    console.log('BillingSummary - Store Total:', store.total)

    // Set currentTotal after ensuring store.total is computed
    currentTotal.value = store.total || 0
    grandTotal.value = currentTotal.value + outstandingBalance.value
    console.log('BillingSummary - Current Total:', currentTotal.value)
    console.log('BillingSummary - Grand Total:', grandTotal.value)

    emit('update-total', {
      currentTotal: currentTotal.value,
      grandTotal: grandTotal.value,
      prepaidBalance: prepaidBalance.value,
      arrears: arrears.value,
      totalPayments: totalPayments.value,
    })
  } catch (error) {
    console.error('BillingSummary - Error fetching data:', error.message)
    toast.error('Failed to load bill summary: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchData)

// Watch refreshKey to trigger fetchData
watch(
  () => props.refreshKey,
  () => {
    console.log('BillingSummary - Refresh triggered:', props.refreshKey)
    fetchData()
  },
)

// Watch store totals and invoice data
watch(
  [store.total, store.invoiceId, outstandingBalance, arrears, prepaidBalance, totalPayments],
  () => {
    currentTotal.value = store.total || 0
    grandTotal.value = currentTotal.value + outstandingBalance.value
    console.log('BillingSummary - Updated Current Total:', currentTotal.value)
    console.log('BillingSummary - Updated Grand Total:', grandTotal.value)

    emit('update-total', {
      currentTotal: currentTotal.value,
      grandTotal: grandTotal.value,
      prepaidBalance: prepaidBalance.value,
      arrears: arrears.value,
      totalPayments: totalPayments.value,
    })
  },
)

// Watch store.errorMessage for success and error messages
watch(
  () => store.errorMessage,
  (newMessage) => {
    if (newMessage) {
      if (newMessage.includes('Payment successful')) {
        toast.success(newMessage)
      } else {
        toast.error(newMessage)
      }
    }
  },
)
</script>

<template>
  <v-card elevation="1" class="hover-scale fade-in delay-100" :disabled="isLoading">
    <v-card-title class="text-h6 font-weight-bold">Bill Summary</v-card-title>
    <v-divider></v-divider>
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    ></v-progress-linear>
    <v-card-text v-else>
      <v-list density="compact">
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="deep-orange">mdi-home-city</v-icon>
          </template>
          <v-list-item-title>Rent</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.effectiveRates.rent.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="amber">mdi-lightning-bolt</v-icon>
          </template>
          <v-list-item-title>Electricity</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.effectiveRates.electricity.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="blue">mdi-water</v-icon>
          </template>
          <v-list-item-title>Water</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.effectiveRates.water.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="green">mdi-wifi</v-icon>
          </template>
          <v-list-item-title>Internet</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.effectiveRates.wifi.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="purple">mdi-calculator</v-icon>
          </template>
          <v-list-item-title>Current Total</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-purple">
            ₱{{ currentTotal.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="red">mdi-alert-circle</v-icon>
          </template>
          <v-list-item-title>Outstanding Balance</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-error">
            ₱{{ outstandingBalance.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="orange">mdi-alert</v-icon>
          </template>
          <v-list-item-title>Total Arrears</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-orange">
            ₱{{ arrears.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="green">mdi-cash-check</v-icon>
          </template>
          <v-list-item-title>Prepaid Balance</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-green">
            ₱{{ prepaidBalance.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-list-item v-if="arrears > 0">
          <template v-slot:prepend>
            <v-icon color="blue">mdi-cash-multiple</v-icon>
          </template>
          <v-list-item-title>Total Payments</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-blue">
            ₱{{ totalPayments.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="primary">mdi-cash</v-icon>
          </template>
          <v-list-item-title>Grand Total</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ grandTotal.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.hover-scale {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s;
}
.hover-scale:hover {
  transform: translateY(-3px);
  box-shadow: 0px 8px 16px rgba(0, 0, 0, 0.08);
}
.text-primary {
  color: #578e7e;
}
.text-orange {
  color: #f57c00;
}
.text-green {
  color: #388e3c;
}
.text-blue {
  color: #1976d2;
}
</style>
```
