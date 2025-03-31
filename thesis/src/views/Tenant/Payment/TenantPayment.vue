<script setup>
import { ref } from 'vue'
import BillingSummary from './components/BillingSummary.vue'
import ConfirmPayment from './components/ConfirmPayment.vue'
import { supabase } from '@/utils/supabase'

const currentTotal = ref(0)
const grandTotal = ref(0)
const userId = ref(null)
const invoiceId = ref(null)

// Fetch Outstanding Balance
const fetchOutstandingBalance = async () => {
  try {
    if (!invoiceId.value) {
      console.warn('⚠️ Skipping fetchOutstandingBalance: invoice_id is null')
      return
    }

    console.log('🔍 Fetching outstanding balance for invoice:', invoiceId.value)

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance')
      .eq('invoice_id', invoiceId.value)
      .single()

    if (invoiceError) throw invoiceError

    grandTotal.value = invoiceData.outstanding_balance
  } catch (error) {
    console.error('⚠️ Error fetching outstanding balance:', error.message)
  }
}

// Fetch User Data & Invoice
const fetchUserData = async () => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) throw new Error('No user is currently logged in.')

    userId.value = authData.user.id

    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', userId.value)
      .single()

    if (userError) throw userError

    // If user has no invoice, create one
    if (!userData?.invoice_id) {
      console.log('🟡 No invoice found. Creating new invoice...')

      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert([
          {
            total_amount: 0,
            outstanding_balance: 0,
            due_date: new Date().toISOString().slice(0, 10),
            status: 'pending',
          },
        ])
        .select('invoice_id')
        .single()

      if (createError) throw createError

      invoiceId.value = newInvoice.invoice_id
      console.log('✅ New invoice created:', invoiceId.value)

      // Link new invoice to the user
      const { error: updateError } = await supabase
        .from('users')
        .update({ invoice_id: invoiceId.value })
        .eq('user_id', userId.value)

      if (updateError) throw updateError
    } else {
      invoiceId.value = userData.invoice_id
      console.log('✅ Existing invoice found:', invoiceId.value)
    }

    // Fetch outstanding balance after invoice is assigned
    await fetchOutstandingBalance()
  } catch (error) {
    console.error('⚠️ Error fetching user data:', error.message)
  }
}

// Handle Payment Confirmation
const handleConfirmPayment = async () => {
  try {
    if (!invoiceId.value) {
      alert('⚠️ No invoice assigned. Cannot process payment.')
      return
    }

    console.log('💳 Processing payment for invoice:', invoiceId.value)

    const { error } = await supabase.from('payment').insert([
      {
        amount: grandTotal.value,
        payment_method: 'GCash',
        payment_date: new Date().toISOString(),
        status: 'pending',
        user_id: userId.value,
        invoice_id: invoiceId.value,
      },
    ])

    if (error) {
      console.error('⚠️ Error saving payment:', error)
      alert('Failed to save payment: ' + error.message)
    } else {
      console.log('✅ Payment saved successfully')
      alert('Payment saved successfully!')

      // Refresh balance after payment
      await fetchOutstandingBalance()
    }
  } catch (err) {
    console.error('⚠️ Unexpected error:', err)
  }
}

// Update Totals from BillingSummary
const handleTotalUpdate = (totals) => {
  currentTotal.value = totals.currentTotal
  grandTotal.value = totals.grandTotal
}

// Initial Fetch
fetchUserData()
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Make a Payment</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Review your bill and proceed to secure payment via PayMongo.
        </p>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-6">
      <v-col cols="12" md="6">
        <BillingSummary @update-total="handleTotalUpdate" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <ConfirmPayment
          :grandTotal="grandTotal"
          :currentTotal="currentTotal"
          @confirm-payment="handleConfirmPayment"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
