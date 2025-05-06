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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', user.id)
      .single()

    if (userError) throw userError

    if (!userData.invoice_id) {
      console.warn('BillingSummary - No invoice found. Creating one...')
      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert([
          {
            total_amount: 0,
            outstanding_balance: 0,
            due_date: new Date().toISOString().slice(0, 10),
            status: 'Pending',
          },
        ])
        .select('invoice_id')
        .single()

      if (createError) throw createError

      console.log('BillingSummary - New Invoice Created:', newInvoice.invoice_id)

      const { error: updateError } = await supabase
        .from('users')
        .update({ invoice_id: newInvoice.invoice_id })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      console.log('BillingSummary - User invoice_id updated:', newInvoice.invoice_id)
      userData.invoice_id = newInvoice.invoice_id
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance')
      .eq('invoice_id', userData.invoice_id)
      .single()

    if (invoiceError) throw invoiceError
    outstandingBalance.value = invoiceData?.outstanding_balance || 0
    console.log('BillingSummary - Outstanding Balance:', outstandingBalance.value)

    await store.fetchSettings()
    console.log('BillingSummary - Fetching tenant rates for user_id:', user.id)
    await store.fetchTenantRates(user.id)

    currentTotal.value = store.total
    grandTotal.value = currentTotal.value + outstandingBalance.value
    console.log('BillingSummary - Current Total:', currentTotal.value)
    console.log('BillingSummary - Grand Total:', grandTotal.value)

    emit('update-total', {
      currentTotal: currentTotal.value,
      grandTotal: grandTotal.value,
    })
  } catch (error) {
    console.error('BillingSummary - Error fetching data:', error.message)
    toast.error('Failed to load bill summary: ' + error.message)
  } finally {
    isLoading.value = false
    if (store.errorMessage) {
      toast.error(store.errorMessage)
    }
  }
}

onMounted(fetchData)

watch(
  () => props.refreshKey,
  () => {
    console.log('BillingSummary - Refresh triggered:', props.refreshKey)
    fetchData()
  },
)

watch([store.total, outstandingBalance], () => {
  currentTotal.value = store.total
  grandTotal.value = currentTotal.value + outstandingBalance.value
  console.log('BillingSummary - Updated Current Total:', currentTotal.value)
  console.log('BillingSummary - Updated Grand Total:', grandTotal.value)

  emit('update-total', {
    currentTotal: currentTotal.value,
    grandTotal: grandTotal.value,
  })
})
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
</style>
