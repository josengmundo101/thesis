<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
import { ref, onMounted, watch } from 'vue'
import { supabase } from '@/utils/supabase'

const store = useUtilityStore()
const outstandingBalance = ref(0)
const currentTotal = ref(0)
const grandTotal = ref(0)

// Emit to parent
const emit = defineEmits(['update-total'])

// Fetch outstanding balance for logged-in user
const fetchOutstandingBalance = async () => {
  try {
    // Get the logged-in user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('No user is currently logged in.')

    console.log('✅ User Object:', user) // 👈 Log full user object

    // ✅ Fetch invoice_id from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', user.id)
      .single()

    if (userError) throw userError

    // ✅ If invoice_id is missing, create one
    if (!userData.invoice_id) {
      console.warn('⚠️ No invoice found. Creating one...')

      // Create a new invoice
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

      console.log('✅ New Invoice Created:', newInvoice.invoice_id)

      // Update the user's invoice_id
      const { error: updateError } = await supabase
        .from('users')
        .update({ invoice_id: newInvoice.invoice_id })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      console.log('✅ User invoice_id updated:', newInvoice.invoice_id)
      userData.invoice_id = newInvoice.invoice_id // Update the local reference
    }

    // ✅ Fetch outstanding balance from invoices table
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance')
      .eq('invoice_id', userData.invoice_id)
      .single()

    if (invoiceError) throw invoiceError

    // ✅ Set outstanding balance
    outstandingBalance.value = invoiceData?.outstanding_balance || 0

    // ✅ Set total values
    currentTotal.value = store.total
    grandTotal.value = currentTotal.value + outstandingBalance.value

    console.log('✅ Outstanding Balance:', outstandingBalance.value)
    console.log('✅ Current Total:', currentTotal.value)
    console.log('✅ Grand Total:', grandTotal.value)
  } catch (error) {
    console.error('⚠️ Error fetching outstanding balance:', error.message)
  }
}

// Calculate Totals
const calculateTotals = () => {
  currentTotal.value =
    Number(store.rent) + Number(store.electricity) + Number(store.water) + Number(store.wifi)
  grandTotal.value = currentTotal.value + outstandingBalance.value
  console.log('✅ Current Total:', currentTotal.value)
  console.log('✅ Grand Total:', grandTotal.value)

  emit('update-total', {
    currentTotal: currentTotal.value,
    grandTotal: currentTotal.value,
  })
}

// Fetch data on mount
onMounted(async () => {
  try {
    await store.fetchSettings() // ✅ Ensure settings are loaded first
    await fetchOutstandingBalance() // ✅ Then fetch balance

    // ✅ Calculate totals once
    calculateTotals()
  } catch (error) {
    console.error('⚠️ Error during onMounted:', error.message)
  }
})

// Watch for changes
watch([store.rent, store.electricity, store.water, store.wifi, outstandingBalance], () => {
  calculateTotals()
})
</script>

<template>
  <v-card elevation="1" class="hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Bill Summary</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-list density="compact">
        <!-- Rent -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="deep-orange">mdi-home-city</v-icon>
          </template>
          <v-list-item-title>Rent</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.rent }}
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Electricity -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="amber">mdi-lightning-bolt</v-icon>
          </template>
          <v-list-item-title>Electricity</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.electricity.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Water -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="blue">mdi-water</v-icon>
          </template>
          <v-list-item-title>Water</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.water.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Internet -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="green">mdi-wifi</v-icon>
          </template>
          <v-list-item-title>Internet</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.wifi.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <!-- Current Total -->
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="purple">mdi-calculator</v-icon>
          </template>
          <v-list-item-title>Current Total</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-purple">
            ₱{{ currentTotal.toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item>

        <!-- Outstanding Balance -->
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

        <!-- Grand Total -->
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
