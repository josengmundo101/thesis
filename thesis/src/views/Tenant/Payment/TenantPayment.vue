<script setup>
import { ref, computed, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { supabase } from '@/utils/supabase'
import { useUtilityStore } from '@/stores/useUtilityStore'
import { useToast } from 'vue-toastification'
import BillingSummary from './components/BillingSummary.vue'
import ConfirmPayment from './components/ConfirmPayment.vue'
import { initiatePayment, verifyPaymentIntent } from '@/api/paymongo'

const store = useUtilityStore()
const toast = useToast()
const currentTotal = ref(0)
const grandTotal = ref(0)
const userId = ref(null)
const invoiceId = ref(null)
const paymentIntentId = ref(null)
const showConfirmationDialog = ref(false)
const showAdvanceDialog = ref(false)
const refreshBillingSummary = ref(0)
const months = ref(1)
const paymentMethodType = ref('gcash')
const totalAmount = computed(() => store.total * months.value)
const processedIntents = ref([])

// Compute minimum months to meet PayMongo's ₱10.00 minimum
const minMonths = computed(() => {
  const total = store.total || 0
  if (total <= 0) {
    console.warn('⚠️ Invalid store.total:', total)
    return 1
  }
  const min = Math.ceil(10 / total) // e.g., store.total = 5 → minMonths = 2
  console.log('🔍 Calculated minMonths:', min, 'for store.total:', total)
  return min
})

onErrorCaptured((err) => {
  console.error('🛑 Component Error:', err)
  toast.error('An error occurred: ' + err.message)
  return false
})

const fetchOutstandingBalance = async () => {
  try {
    if (!invoiceId.value) {
      console.warn('⚠️ Skipping fetchOutstandingBalance: invoice_id is null')
      return
    }

    console.log('🔍 Fetching outstanding balance for invoice:', invoiceId.value)

    const invoiceData = await store.fetchInvoiceData(invoiceId.value)
    if (!invoiceData) throw new Error('No invoice data returned')

    grandTotal.value = invoiceData.outstanding_balance
    currentTotal.value = store.total
    refreshBillingSummary.value++

    console.log(
      '✅ Updated grandTotal:',
      grandTotal.value,
      'currentTotal:',
      currentTotal.value,
      'store.total:',
      store.total,
      'prepaid_balance:',
      invoiceData.prepaid_balance,
      'arrears:',
      invoiceData.arrears,
    )
  } catch (error) {
    console.error('⚠️ Error fetching outstanding balance:', error.message)
    toast.error('Failed to fetch balance: ' + error.message)
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
      const today = new Date()
      const nextMonth = new Date(today.setMonth(today.getMonth() + 1)).toISOString().slice(0, 10)

      const { data: newInvoice, error: createError } = await supabase
        .from('invoices')
        .insert([
          {
            total_amount: 0,
            outstanding_balance: 0,
            arrears: 0,
            prepaid_balance: 0,
            due_date: nextMonth,
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
    await store.fetchSettings()
    await store.fetchTenantRates(userId.value)
  } catch (error) {
    console.error('⚠️ Error fetching user data:', error.message)
    toast.error('Failed to load user data: ' + error.message)
  }
}

const openConfirmationDialog = () => {
  if (!invoiceId.value) {
    toast.error('No invoice assigned. Please try again.')
    return
  }
  showConfirmationDialog.value = true
}

const openAdvanceDialog = () => {
  if (!invoiceId.value) {
    toast.error('No invoice assigned. Please try again.')
    return
  }
  if (!store.total || store.total <= 0) {
    toast.error('Invalid invoice total. Please contact support.')
    return
  }
  months.value = minMonths.value // Initialize with minimum months
  showAdvanceDialog.value = true
}

const handleConfirmPayment = async (paymentData) => {
  try {
    const { amount, paymentMethodType } = paymentData
    const amountInCentavos = Math.round(Number(amount) * 100)
    if (!amountInCentavos || amountInCentavos < 1000) {
      toast.error('Invalid payment amount. Minimum is ₱10.00.')
      return
    }
    if (!['gcash', 'paymaya'].includes(paymentMethodType)) {
      toast.error('Invalid payment method. Please select GCash or PayMaya.')
      return
    }

    console.log(
      '💳 Initiating partial payment for invoice:',
      invoiceId.value,
      'Amount (PHP):',
      amount,
      'Amount (centavos):',
      amountInCentavos,
      'Method:',
      paymentMethodType,
    )

    const paymentIntent = await initiatePayment(amount, paymentMethodType)
    paymentIntentId.value = paymentIntent.id

    console.log('🔍 Payment Intent Response:', JSON.stringify(paymentIntent, null, 2))

    const paymentId = await store.savePayment({
      invoiceId: invoiceId.value,
      userId: userId.value,
      amount: amount,
      paymentMethod: paymentMethodType,
      paymentIntentId: paymentIntent.id,
      paymentType: 'partial',
    })

    console.log('✅ Payment saved with ID:', paymentId)

    if (paymentIntent.attributes.next_action) {
      const redirectUrl = paymentIntent.attributes.next_action.redirect.url
      console.log('🔗 Redirecting to:', redirectUrl)
      window.location.href = redirectUrl
    } else {
      console.error('⚠️ No next_action in payment intent:', paymentIntent.attributes)
      toast.error('Payment initiation failed: No redirect action available.')
    }

    showConfirmationDialog.value = false
  } catch (err) {
    console.error('⚠️ Partial payment error:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      errors: err.response?.data?.errors,
    })
    const errorDetail = err.response?.data?.errors?.[0]?.detail || err.message
    toast.error(`Partial payment failed: ${errorDetail}`)
  }
}

const submitAdvancePayment = async () => {
  try {
    console.log('🔍 Advance payment validation:', {
      months: months.value,
      minMonths: minMonths.value,
      storeTotal: store.total,
      totalAmount: totalAmount.value,
    })

    if (!Number.isInteger(months.value) || months.value < minMonths.value) {
      toast.error(
        `Please enter at least ${minMonths.value} month${minMonths.value > 1 ? 's' : ''} to meet the minimum payment of ₱10.00 (store.total: ₱${store.total}).`,
      )
      return
    }
    if (!['gcash', 'paymaya'].includes(paymentMethodType.value)) {
      toast.error('Please select GCash or PayMaya.')
      return
    }

    const amountInCentavos = Math.round(Number(totalAmount.value) * 100)
    if (!amountInCentavos || amountInCentavos < 1000) {
      toast.error(
        `Invalid advance payment amount. Minimum is ₱10.00. Current amount: ₱${(amountInCentavos / 100).toFixed(2)} (store.total: ₱${store.total})`,
      )
      return
    }

    console.log(
      '💳 Initiating advance payment for invoice:',
      invoiceId.value,
      'Months:',
      months.value,
      'Store Total (PHP):',
      store.total,
      'Amount (PHP):',
      totalAmount.value,
      'Amount (centavos):',
      amountInCentavos,
      'Method:',
      paymentMethodType.value,
    )

    const paymentIntent = await initiatePayment(totalAmount.value, paymentMethodType.value)
    paymentIntentId.value = paymentIntent.id

    console.log('🔍 Payment Intent Response:', JSON.stringify(paymentIntent, null, 2))

    const paymentId = await store.savePayment({
      invoiceId: invoiceId.value,
      userId: userId.value,
      amount: totalAmount.value,
      paymentMethod: paymentMethodType.value,
      paymentIntentId: paymentIntent.id,
      paymentType: 'advance',
      months: months.value,
    })

    console.log('✅ Advance payment saved with ID:', paymentId)

    if (paymentIntent.attributes.next_action) {
      const redirectUrl = paymentIntent.attributes.next_action.redirect.url
      console.log('🔗 Redirecting to:', redirectUrl)
      window.location.href = redirectUrl
    } else {
      console.error('⚠️ No next_action in payment intent:', paymentIntent.attributes)
      toast.error('Payment initiation failed: No redirect action available.')
    }

    showAdvanceDialog.value = false
  } catch (err) {
    console.error('⚠️ Advance payment error:', {
      message: err.message,
      status: err.response?.status,
      errors: err.response?.data?.errors,
      responseData: JSON.stringify(err.response?.data, null, 2),
    })
    const errorDetail = err.response?.data?.errors?.[0]?.detail || err.message || 'Unknown error'
    toast.error(`Advance payment failed: ${errorDetail}`)
  }
}

const checkPaymentCallback = async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentIntentId = urlParams.get('payment_intent_id')
    const error = urlParams.get('error')

    if (error) {
      toast.error('Payment failed: ' + error)
      return
    }

    if (paymentIntentId && !processedIntents.value.includes(paymentIntentId)) {
      processedIntents.value.push(paymentIntentId)
      console.log('🔍 Verifying payment for payment_intent_id:', paymentIntentId)

      const paymentIntent = await verifyPaymentIntent(paymentIntentId)
      const paymentStatus = paymentIntent.attributes.status

      if (paymentStatus === 'succeeded') {
        const { data: payment, error: paymentError } = await supabase
          .from('payment')
          .select('payment_id, amount, payment_type, months')
          .eq('payment_intent_id', paymentIntentId)
          .eq('invoice_id', invoiceId.value)
          .single()

        if (paymentError || !payment) {
          throw new Error('Payment record not found')
        }

        let newBalance
        if (payment.payment_type === 'advance') {
          newBalance = await store.processAdvancePayment(
            invoiceId.value,
            payment.months,
            payment.amount,
            payment.payment_id,
          )
        } else {
          newBalance = await store.processPartialPayment(
            invoiceId.value,
            payment.amount,
            payment.payment_id,
          )
        }

        const { error: paymentUpdateError } = await supabase
          .from('payment')
          .update({ status: 'approved' })
          .eq('payment_intent_id', paymentIntentId)
        if (paymentUpdateError) throw paymentUpdateError

        const nextDueDate = new Date()
        nextDueDate.setMonth(
          nextDueDate.getMonth() + (payment.payment_type === 'advance' ? payment.months : 1),
        )
        const formattedNextDueDate = nextDueDate.toISOString().slice(0, 10)

        const { error: invoiceUpdateError } = await supabase
          .from('invoices')
          .update({
            status: newBalance > 0 ? 'pending' : 'approved',
            due_date: formattedNextDueDate,
            updated_at: new Date().toISOString(),
          })
          .eq('invoice_id', invoiceId.value)
        if (invoiceUpdateError) throw invoiceUpdateError

        grandTotal.value = newBalance
        refreshBillingSummary.value++

        console.log('✅ Payment completed and invoice updated:', {
          newBalance,
          payment_type: payment.payment_type,
        })
        toast.success('Payment successful!')
        await fetchOutstandingBalance()
      } else {
        console.error('⚠️ Payment failed or pending:', paymentStatus)
        toast.error('Payment not completed. Please try again.')
      }
    }
  } catch (err) {
    console.error('⚠️ Error verifying payment:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status,
      errors: err.response?.data?.errors,
    })
    const errorMessage = err.message.includes('payment_status_check')
      ? 'Invalid payment status. Please try again or contact support.'
      : err.response?.data?.errors?.[0]?.detail || err.message
    toast.error(`Error verifying payment: ${errorMessage}`)
  }
}

const handleTotalUpdate = (totals) => {
  currentTotal.value = totals.currentTotal
  grandTotal.value = totals.grandTotal
}

const handlePaymentProcessed = (event) => {
  console.log('🔔 Payment processed event:', event.detail)
  grandTotal.value = event.detail.outstandingBalance
  refreshBillingSummary.value++
  fetchOutstandingBalance()
}

onMounted(() => {
  window.addEventListener('payment-processed', handlePaymentProcessed)
})

onUnmounted(() => {
  window.removeEventListener('payment-processed', handlePaymentProcessed)
})

try {
  fetchUserData()
  checkPaymentCallback()
} catch (error) {
  console.error('🛑 Initialization Error:', error)
  toast.error('Initialization failed: ' + error.message)
}
</script>

<template>
  <v-container fluid class="py-10">
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Make a Payment</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Review your bill and proceed to secure payment.
        </p>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-6">
      <v-col cols="12" md="6">
        <BillingSummary :refreshKey="refreshBillingSummary" @update-total="handleTotalUpdate" />
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <v-btn color="primary" block @click="openConfirmationDialog">Make Partial Payment</v-btn>
      </v-col>
    </v-row>

    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <v-btn color="secondary" block @click="openAdvanceDialog">Make Advance Payment</v-btn>
      </v-col>
    </v-row>

    <v-dialog v-model="showConfirmationDialog" max-width="600">
      <ConfirmPayment
        :userId="userId"
        :invoiceId="invoiceId"
        :currentTotal="currentTotal"
        :grandTotal="grandTotal"
        @confirm-payment="handleConfirmPayment"
        @close="showConfirmationDialog = false"
      />
    </v-dialog>

    <v-dialog v-model="showAdvanceDialog" max-width="600">
      <v-card>
        <v-card-title>Advance Payment</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="submitAdvancePayment">
            <v-text-field
              v-model.number="months"
              label="Months to Prepay"
              type="number"
              :min="minMonths"
              :hint="`Minimum ${minMonths} month${minMonths > 1 ? 's' : ''} required for ₱${store.total} monthly rate`"
              persistent-hint
              required
            ></v-text-field>
            <div class="d-flex align-center">
              <v-icon left>mdi-currency-php</v-icon>
              <v-text class="text-body-1">Total Amount: ₱{{ totalAmount.toFixed(2) }}</v-text>
            </div>
            <v-select
              v-model="paymentMethodType"
              :items="['gcash', 'paymaya']"
              label="Payment Method"
              required
            ></v-select>
            <v-btn type="submit" color="primary" block>Pay Advance</v-btn>
            <v-btn color="secondary" block @click="showAdvanceDialog = false" class="mt-2"
              >Cancel</v-btn
            >
          </v-form>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.hover-scale {
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s;
}
.hover-scale:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}
</style>
