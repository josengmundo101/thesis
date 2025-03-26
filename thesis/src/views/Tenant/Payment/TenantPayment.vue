<script setup>
import { ref } from 'vue'
import BillingSummary from './components/BillingSummary.vue'
import ConfirmPayment from './components/ConfirmPayment.vue'
import { supabase } from '@/utils/supabase'

const currentTotal = ref(0)
const grandTotal = ref(0)
const userId = ref(null)
const invoiceId = ref(null)

const fetchUserData = async () => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('No user is currently logged in.')

    userId.value = user.id

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', user.id)
      .single()

    if (userError) throw userError

    if (!userData.invoice_id) {
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

      const { error: updateError } = await supabase
        .from('users')
        .update({ invoice_id: newInvoice.invoice_id })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      invoiceId.value = newInvoice.invoice_id
    } else {
      invoiceId.value = userData.invoice_id
    }

    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('outstanding_balance')
      .eq('invoice_id', invoiceId.value)
      .single()

    if (invoiceError) throw invoiceError
    grandTotal.value = invoiceData.outstanding_balance
  } catch (error) {
    console.error('Error fetching user data:', error.message)
  }
}

const handleTotalUpdate = (totals) => {
  currentTotal.value = totals.currentTotal
  grandTotal.value = totals.grandTotal
}

const handleConfirmPayment = async () => {
  try {
    const { error } = await supabase.from('payment').insert([
      {
        amount: grandTotal.value, // Use dynamic total
        payment_method: 'GCash', // or 'PayMongo' based on user input
        payment_date: new Date().toISOString(),
        status: 'pending',
        user_id: userId.value,
        invoice_id: invoiceId.value,
      },
    ])

    if (error) {
      console.log('⚠️ Error saving payment:', error)
      alert('Failed to save payment: ' + error.message)
    } else {
      console.log('✅ Payment saved successfully')
      alert('Payment saved successfully!')
    }
  } catch (err) {
    console.error('⚠️ Unexpected error:', err)
  }
}

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
