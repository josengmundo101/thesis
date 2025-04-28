<script setup>
import { ref, onErrorCaptured } from 'vue'
import BillingSummary from './components/BillingSummary.vue'
import ConfirmPayment from './components/ConfirmPayment.vue'
import { supabase } from '@/utils/supabase'
import { initiatePayment, verifyPaymentIntent } from '@/api/paymongo'

const currentTotal = ref(0)
const grandTotal = ref(0)
const userId = ref(null)
const invoiceId = ref(null)
const paymentIntentId = ref(null)

// Catch component errors
onErrorCaptured((err) => {
  console.error('🛑 Component Error:', err)
  return false
})

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

const fetchUserData = async () => {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.warn('⚠️ No user logged in:', authError?.message || 'No user')
      window.location.href = '/login'
      return
    }

    userId.value = authData.user.id

    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('invoice_id')
      .eq('user_id', userId.value)
      .single()

    if (userError) throw userError

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

      const { error: updateError } = await supabase
        .from('users')
        .update({ invoice_id: invoiceId.value })
        .eq('user_id', userId.value)

      if (updateError) throw updateError
    } else {
      invoiceId.value = userData.invoice_id
      console.log('✅ Existing invoice found:', invoiceId.value)
    }

    await fetchOutstandingBalance()
  } catch (error) {
    console.error('⚠️ Error fetching user data:', error.message)
  }
}

const handleConfirmPayment = async (paymentMethodType = 'gcash') => {
  try {
    if (!invoiceId.value) {
      alert('⚠️ No invoice assigned. Cannot process payment.')
      return
    }

    if (!grandTotal.value || grandTotal.value < 1) {
      alert('⚠️ Invalid payment amount. Please enter a valid amount.')
      return
    }

    console.log(
      '💳 Initiating payment for invoice:',
      invoiceId.value,
      'Amount:',
      grandTotal.value,
      'Method:',
      paymentMethodType,
    )

    const paymentIntent = await initiatePayment(grandTotal.value, paymentMethodType)
    paymentIntentId.value = paymentIntent.id

    console.log('🔍 Payment Intent Response:', JSON.stringify(paymentIntent, null, 2))

    const { error: paymentError } = await supabase.from('payment').insert([
      {
        amount: grandTotal.value,
        payment_method: paymentMethodType,
        payment_date: new Date().toISOString(),
        status: 'pending', // Always pending for admin approval
        user_id: userId.value,
        invoice_id: invoiceId.value,
        payment_intent_id: paymentIntentId.value,
      },
    ])

    if (paymentError) {
      console.error('⚠️ Error saving payment:', paymentError)
      alert('Failed to save payment: ' + paymentError.message)
      return
    }

    console.log('✅ Payment Intent created:', paymentIntent)

    if (paymentMethodType === 'gcash' || paymentMethodType === 'paymaya') {
      if (!paymentIntent.attributes.next_action) {
        console.error('⚠️ No next_action in payment intent:', {
          status: paymentIntent.attributes.status,
          payment_method_allowed: paymentIntent.attributes.payment_method_allowed,
          intent_id: paymentIntent.id,
        })
        alert('Payment initiation failed: No redirect action available. Please try again.')
        return
      }
      const redirectUrl = paymentIntent.attributes.next_action.redirect.url
      console.log('🔗 Redirecting to:', redirectUrl)
      window.location.href = redirectUrl
    } else {
      alert('Unsupported payment method. Please select GCash or PayMaya.')
    }
  } catch (err) {
    console.error('⚠️ Unexpected error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    })
    const errorMessage = err.response?.data?.errors?.[0]?.detail || err.message
    alert(`Payment failed: ${errorMessage}`)
  }
}

const checkPaymentCallback = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentIntentId = urlParams.get('payment_intent_id')
    const error = urlParams.get('error')

    if (error) {
      alert('Payment failed. Please try again.')
      return
    }

    if (paymentIntentId) {
      const paymentIntent = await verifyPaymentIntent(paymentIntentId)
      const paymentStatus = paymentIntent.attributes.status

      if (paymentStatus === 'succeeded') {
        const nextDueDate = new Date()
        nextDueDate.setMonth(nextDueDate.getMonth() + 1)
        const formattedNextDueDate = nextDueDate.toISOString().slice(0, 10)

        const { error: invoiceUpdateError } = await supabase
          .from('invoices')
          .update({
            outstanding_balance: 0,
            status: 'approved', // Invoice reflects payment, pending admin approval for payment status
            due_date: formattedNextDueDate,
          })
          .eq('invoice_id', invoiceId.value)

        if (invoiceUpdateError) throw invoiceUpdateError

        console.log('✅ Payment completed and invoice updated.')
        alert('Payment successful! Your outstanding balance is now 0. Awaiting admin approval.')
        await fetchOutstandingBalance()
      } else {
        console.error('⚠️ Payment failed or pending:', paymentStatus)
        alert('Payment not completed. Please try again.')
      }
    }
  } catch (err) {
    console.error('⚠️ Error verifying payment:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
    })
    const errorMessage = err.message.includes('payment_status_check')
      ? 'Invalid payment status. Please try again or contact support.'
      : err.response?.data?.errors?.[0]?.detail || err.message
    alert(`Error verifying payment: ${errorMessage}`)
  }
}

const handleTotalUpdate = (totals) => {
  currentTotal.value = totals.currentTotal
  grandTotal.value = totals.grandTotal
}

// Initialize
try {
  fetchUserData()
  checkPaymentCallback()
} catch (error) {
  console.error('🛑 Initialization Error:', error)
}
</script>

<template>
  <v-container fluid class="py-10">
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
