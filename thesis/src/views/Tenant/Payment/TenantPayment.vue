<script setup>
import { ref, computed, onMounted, onUnmounted, onErrorCaptured, watch } from 'vue'
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
const prepaidBalance = ref(0)
const arrears = ref(0)
const totalPayments = ref(0)
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
const isLoading = ref(true)
const isProcessingPayment = ref(false)

onErrorCaptured((err, instance, info) => {
  console.error('🛑 TenantPayment Error:', { err, instance, info })
  toast.error('An error occurred: ' + err.message)
  return false
})

const minMonths = computed(() => {
  const total = store.total || 0
  if (total <= 0) {
    console.warn('⚠️ Invalid store.total:', total)
    return 1
  }
  const min = Math.ceil(10 / total)
  console.log('🔍 Calculated minMonths:', min, 'for store.total:', total)
  return min
})

const fetchOutstandingBalance = async () => {
  try {
    if (!store.invoiceId) {
      console.warn('⚠️ Skipping fetchOutstandingBalance: invoice_id is null')
      return
    }

    console.log('🔍 Fetching outstanding balance for invoice:', store.invoiceId)

    const invoiceData = await store.fetchInvoiceData(store.invoiceId)
    if (!invoiceData) throw new Error('No invoice data returned')

    grandTotal.value = invoiceData.outstanding_balance
    currentTotal.value = store.total
    prepaidBalance.value = invoiceData.prepaid_balance
    arrears.value = invoiceData.arrears
    refreshBillingSummary.value++
    console.log('✅ fetchOutstandingBalance updated:', {
      grandTotal: grandTotal.value,
      currentTotal: currentTotal.value,
      prepaidBalance: prepaidBalance.value,
      arrears: arrears.value,
      storeTotal: store.total,
      totalPayments: totalPayments.value,
      status: invoiceData.status,
    })

    // Trigger event for TenantDashboard to refresh SummaryCard
    window.dispatchEvent(
      new CustomEvent('invoice-updated', {
        detail: {
          invoiceId: store.invoiceId,
          outstandingBalance: invoiceData.outstanding_balance,
          arrears: invoiceData.arrears,
          prepaidBalance: invoiceData.prepaid_balance,
          status: invoiceData.status,
        },
      }),
    )
  } catch (error) {
    console.error('⚠️ Error fetching outstanding balance:', {
      message: error.message,
      stack: error.stack,
    })
    toast.error('Failed to fetch balance: ' + error.message)
  }
}

const fetchUserData = async () => {
  isLoading.value = true
  try {
    console.log('🔍 TenantPayment - Fetching user data')
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.warn('⚠️ No user logged in:', authError?.message || 'No user')
      toast.error('Please log in to continue')
      window.location.href = '/login'
      return
    }

    userId.value = authData.user.id
    console.log('✅ TenantPayment - User ID:', userId.value)

    await store.fetchInvoiceId()
    invoiceId.value = store.invoiceId
    console.log('✅ TenantPayment - Invoice ID:', store.invoiceId)

    if (!store.invoiceId) {
      console.warn('⚠️ No invoice assigned for user')
      toast.error('No invoice assigned. Please contact support.')
      return
    }

    await store.fetchSettings()
    await store.fetchTenantRates(userId.value)
    console.log('🔍 TenantPayment - store.total after fetchTenantRates:', store.total)
    if (!store.total || store.total <= 0) {
      console.error('⚠️ Invalid store.total after fetchTenantRates:', store.total)
      toast.error('Failed to load billing rates. Please contact support.')
      return
    }
    await fetchOutstandingBalance()
  } catch (error) {
    console.error('⚠️ TenantPayment - Error fetching user data:', {
      message: error.message,
      stack: error.stack,
    })
    toast.error('Failed to load user data: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

const checkPendingPayments = async () => {
  try {
    if (!store.invoiceId || !userId.value) {
      console.log('🔍 Skipping checkPendingPayments: No invoiceId or userId')
      return
    }

    console.log('🔍 Checking for pending payments for invoice:', store.invoiceId)
    const { data: pendingPayments, error } = await supabase
      .from('payment')
      .select('payment_id, payment_intent_id, amount, payment_type, months, status')
      .eq('invoice_id', store.invoiceId)
      .eq('user_id', userId.value)
      .eq('status', 'pending')

    if (error) throw error
    if (!pendingPayments || pendingPayments.length === 0) {
      console.log('🔍 No pending payments found')
      return
    }

    console.log('🔍 Found pending payments:', pendingPayments.length)
    for (const payment of pendingPayments) {
      if (processedIntents.value.includes(payment.payment_intent_id)) {
        console.log('🔍 Skipping already processed payment:', payment.payment_intent_id)
        continue
      }

      console.log('🔍 Processing pending payment:', {
        payment_id: payment.payment_id,
        payment_intent_id: payment.payment_intent_id,
        current_status: payment.status,
      })

      isProcessingPayment.value = true
      toast.info(`Verifying pending payment ${payment.payment_intent_id}...`)

      const paymentIntent = await verifyPaymentIntent(payment.payment_intent_id)
      console.log('🔍 Payment Intent Status:', paymentIntent.attributes.status)

      if (paymentIntent.attributes.status !== 'succeeded') {
        console.warn('⚠️ Pending payment not succeeded:', paymentIntent.attributes.status)
        continue
      }

      if (payment.status !== 'pending') {
        console.warn('⚠️ Payment status not pending, skipping update:', {
          payment_id: payment.payment_id,
          current_status: payment.status,
        })
        continue
      }

      processedIntents.value.push(payment.payment_intent_id)
      localStorage.setItem('processedIntents', JSON.stringify(processedIntents.value))

      console.log('🔍 Updating payment status to approved for:', payment.payment_id)
      const { error: updateError } = await supabase
        .from('payment')
        .update({ status: 'approved' })
        .eq('payment_id', payment.payment_id)
      if (updateError) {
        console.error('⚠️ Failed to update payment status:', {
          payment_id: payment.payment_id,
          error_message: updateError.message,
          error_details: updateError.details,
        })
        throw updateError
      }

      let newBalance
      if (payment.payment_type === 'advance') {
        newBalance = await store.processAdvancePayment(
          store.invoiceId,
          payment.months,
          payment.amount,
          payment.payment_id,
        )
      } else {
        newBalance = await store.processPartialPayment(
          store.invoiceId,
          payment.amount,
          payment.payment_id,
        )
      }

      console.log('✅ Processed pending payment, new balance:', newBalance)
      await fetchOutstandingBalance()
      toast.success(`Pending payment ${payment.payment_intent_id} processed successfully!`)
    }
  } catch (error) {
    console.error('⚠️ Error checking pending payments:', {
      message: error.message,
      stack: error.stack,
      details: error.details,
    })
    toast.error('Failed to process pending payments: ' + error.message)
  } finally {
    isProcessingPayment.value = false
  }
}

const openConfirmationDialog = () => {
  if (!store.invoiceId) {
    toast.error('No invoice assigned. Please try again.')
    return
  }
  if (!store.total || store.total <= 0) {
    console.error('⚠️ Invalid store.total for partial payment:', store.total)
    toast.error('Invalid billing total. Please contact support.')
    return
  }
  showConfirmationDialog.value = true
}

const openAdvanceDialog = () => {
  if (!store.invoiceId) {
    toast.error('No invoice assigned. Please try again.')
    return
  }
  if (!store.total || store.total <= 0) {
    console.error('⚠️ Invalid store.total for advance payment:', store.total)
    toast.error('Invalid billing total. Please contact support.')
    return
  }
  months.value = minMonths.value
  showAdvanceDialog.value = true
}

const handleConfirmPayment = async (paymentData) => {
  try {
    const { amount, paymentMethodType: method } = paymentData
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      console.error('⚠️ Invalid payment amount:', amount)
      toast.error('Payment amount must be a positive number.')
      return
    }
    const amountInCentavos = Math.round(parsedAmount * 100)
    if (amountInCentavos < 1000) {
      toast.error('Invalid payment amount. Minimum is ₱10.00.')
      return
    }

    console.log(
      '💳 Initiating partial payment for invoice:',
      store.invoiceId,
      'Amount (PHP):',
      parsedAmount,
      'Amount (centavos):',
      amountInCentavos,
      'Method:',
      method,
    )

    isProcessingPayment.value = true
    toast.info('Initiating payment, please wait...')

    const paymentIntent = await initiatePayment(parsedAmount, method)
    paymentIntentId.value = paymentIntent.id

    console.log('🔍 Payment Intent Response:', JSON.stringify(paymentIntent, null, 2))

    const paymentId = await store.savePayment({
      invoiceId: store.invoiceId,
      userId: userId.value,
      amount: parsedAmount,
      paymentMethod: method,
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
  } finally {
    isProcessingPayment.value = false
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
    if (!store.total || store.total <= 0 || isNaN(store.total)) {
      console.error('⚠️ Invalid store.total for advance payment:', store.total)
      toast.error('Invalid billing total. Please contact support.')
      return
    }
    if (!Number.isInteger(months.value) || months.value < minMonths.value) {
      toast.error(
        `Please enter at least ${minMonths.value} month${minMonths.value > 1 ? 's' : ''} to meet the minimum payment of ₱10.00.`,
      )
      return
    }
    if (!['gcash', 'paymaya'].includes(paymentMethodType.value)) {
      toast.error('Please select GCash or PayMaya.')
      return
    }

    const parsedTotalAmount = Number(totalAmount.value)
    const amountInCentavos = Math.round(parsedTotalAmount * 100)
    if (!amountInCentavos || amountInCentavos < 1000 || isNaN(parsedTotalAmount)) {
      toast.error(
        `Invalid advance payment amount. Minimum is ₱10.00. Current amount: ₱${(amountInCentavos / 100).toFixed(2)}.`,
      )
      return
    }

    console.log(
      '💳 Initiating advance payment for invoice:',
      store.invoiceId,
      'Months:',
      months.value,
      'Store Total (PHP):',
      store.total,
      'Amount (PHP):',
      parsedTotalAmount,
      'Amount (centavos):',
      amountInCentavos,
      'Method:',
      paymentMethodType.value,
    )

    isProcessingPayment.value = true
    toast.info('Initiating advance payment, please wait...')

    const paymentIntent = await initiatePayment(parsedTotalAmount, paymentMethodType.value)
    paymentIntentId.value = paymentIntent.id

    console.log('🔍 Payment Intent Response:', JSON.stringify(paymentIntent, null, 2))

    const paymentId = await store.savePayment({
      invoiceId: store.invoiceId,
      userId: userId.value,
      amount: parsedTotalAmount,
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
  } finally {
    isProcessingPayment.value = false
  }
}

const checkPaymentCallback = async () => {
  try {
    isProcessingPayment.value = true
    toast.info('Verifying payment, please wait...')

    const urlParams = new URLSearchParams(window.location.search)
    const paymentIntentId = urlParams.get('payment_intent_id')
    const error = urlParams.get('error')

    if (error) {
      toast.error('Payment failed: ' + error)
      return
    }

    if (!paymentIntentId) {
      console.log('🔍 No payment_intent_id, skipping verification')
      return
    }

    const processed = JSON.parse(localStorage.getItem('processedIntents') || '[]')
    if (processed.includes(paymentIntentId)) {
      console.log('🔍 Payment intent already processed:', paymentIntentId)
      return
    }

    console.log('🔍 Verifying payment:', paymentIntentId)
    processed.push(paymentIntentId)
    localStorage.setItem('processedIntents', JSON.stringify(processed))
    processedIntents.value.push(paymentIntentId)

    const paymentIntent = await verifyPaymentIntent(paymentIntentId)
    console.log('🔍 Payment Intent Status:', paymentIntent.attributes.status)

    if (paymentIntent.attributes.status !== 'succeeded') {
      console.error('⚠️ Payment not succeeded:', paymentIntent.attributes.status)
      toast.error(`Payment not completed. Status: ${paymentIntent.attributes.status}`)
      return
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payment')
      .select('payment_id, amount, payment_type, months, status')
      .eq('payment_intent_id', paymentIntentId)
      .eq('invoice_id', store.invoiceId)
      .single()

    if (paymentError || !payment) {
      console.error('⚠️ Payment record not found:', paymentError?.message)
      throw new Error('Payment record not found')
    }

    console.log('🔍 Payment record:', {
      payment_id: payment.payment_id,
      amount: payment.amount,
      payment_type: payment.payment_type,
      months: payment.months,
      status: payment.status,
    })

    if (payment.status === 'approved') {
      console.log('🔍 Payment already approved:', payment.payment_id)
      await fetchOutstandingBalance()
      return
    }

    if (payment.status !== 'pending') {
      console.warn('⚠️ Payment status not pending, skipping update:', {
        payment_id: payment.payment_id,
        current_status: payment.status,
      })
      return
    }

    console.log('🔍 Updating payment status to approved for:', payment.payment_id)
    const { error: updateError } = await supabase
      .from('payment')
      .update({ status: 'approved' })
      .eq('payment_id', payment.payment_id)
    if (updateError) {
      console.error('⚠️ Failed to update payment status:', {
        payment_id: payment.payment_id,
        error_message: updateError.message,
        error_details: updateError.details,
      })
      throw updateError
    }

    const parsedAmount = Number(payment.amount)
    if (!parsedAmount || parsedAmount <= 0 || isNaN(parsedAmount)) {
      console.error('⚠️ Invalid payment amount:', payment.amount)
      toast.error('Invalid payment amount')
      return
    }

    let newBalance
    if (payment.payment_type === 'advance') {
      newBalance = await store.processAdvancePayment(
        store.invoiceId,
        payment.months,
        parsedAmount,
        payment.payment_id,
      )
    } else {
      newBalance = await store.processPartialPayment(
        store.invoiceId,
        parsedAmount,
        payment.payment_id,
      )
    }

    console.log('✅ Processed payment, new balance:', newBalance)

    const invoiceData = await store.fetchInvoiceData(store.invoiceId)
    console.log('✅ Final invoice state:', {
      prepaid_balance: invoiceData.prepaid_balance,
      outstanding_balance: invoiceData.outstanding_balance,
      arrears: invoiceData.arrears,
      status: invoiceData.status,
      due_date: invoiceData.due_date,
    })

    window.history.replaceState({}, document.title, window.location.pathname)

    await fetchOutstandingBalance()
    toast.success('Payment processed successfully!')
  } catch (err) {
    console.error('⚠️ Error verifying payment:', {
      message: err.message,
      stack: err.stack,
      details: err.details,
    })
    toast.error('Payment verification failed: ' + err.message)
  } finally {
    isProcessingPayment.value = false
  }
}

const handleTotalUpdate = (totals) => {
  currentTotal.value = totals.currentTotal
  grandTotal.value = totals.grandTotal
  prepaidBalance.value = totals.prepaidBalance
  arrears.value = totals.arrears
  totalPayments.value = totals.totalPayments
  console.log('🔍 handleTotalUpdate:', {
    currentTotal: currentTotal.value,
    grandTotal: grandTotal.value,
    prepaidBalance: prepaidBalance.value,
    arrears: arrears.value,
    totalPayments: totals.totalPayments,
  })
}

const handlePaymentProcessed = (event) => {
  console.log('🔔 Payment processed event:', event.detail)
  grandTotal.value = event.detail.outstandingBalance
  prepaidBalance.value = event.detail.prepaidBalance || prepaidBalance.value
  arrears.value = event.detail.arrears || arrears.value
  refreshBillingSummary.value++
  fetchOutstandingBalance()
}

watch(
  () => store.errorMessage,
  (newMessage) => {
    if (newMessage) {
      if (newMessage.includes('successfully')) {
        toast.success(newMessage)
      } else {
        toast.error(newMessage)
      }
    }
  },
)

onMounted(async () => {
  console.log('✅ TenantPayment - Component mounted')
  window.addEventListener('payment-processed', handlePaymentProcessed)
  await fetchUserData()
  await checkPaymentCallback()
  await checkPendingPayments()
})

onUnmounted(() => {
  console.log('✅ TenantPayment - Component unmounted')
  window.removeEventListener('payment-processed', handlePaymentProcessed)
})
</script>

<template>
  <v-container fluid class="py-10">
    <v-progress-linear
      v-if="isLoading || isProcessingPayment"
      indeterminate
      color="primary"
      class="mb-4"
    ></v-progress-linear>
    <v-row v-else justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Make a Payment</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Review your bill and proceed to secure payment.
        </p>
      </v-col>
    </v-row>

    <v-row v-if="!store.invoiceId && !isLoading" justify="center">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>No Invoice Assigned</v-card-title>
          <v-card-text>
            <p>No invoice is assigned to your account. Please contact support.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="store.invoiceId && !isLoading" justify="center" class="mt-6">
      <v-col cols="12" md="6">
        <BillingSummary :refreshKey="refreshBillingSummary" @update-total="handleTotalUpdate" />
      </v-col>
    </v-row>

    <v-row v-if="store.invoiceId && !isLoading" justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <v-btn
          color="primary"
          block
          @click="openConfirmationDialog"
          :disabled="isProcessingPayment"
        >
          Make Partial Payment
        </v-btn>
      </v-col>
    </v-row>

    <v-row v-if="store.invoiceId && !isLoading" justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <v-btn color="secondary" block @click="openAdvanceDialog" :disabled="isProcessingPayment">
          Make Advance Payment
        </v-btn>
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
            <v-btn type="submit" color="primary" block :disabled="isProcessingPayment">
              Pay Advance
            </v-btn>
            <v-btn color="secondary" block @click="showAdvanceDialog = false" class="mt-2">
              Cancel
            </v-btn>
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
