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

onErrorCaptured((err, instance, info) => {
  console.error('🛑 TenantPayment Error:', { err, instance, info })
  toast.error('An error occurred: ' + err.message)
  return false // Prevent error propagation
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
    })
  } catch (error) {
    console.error('⚠️ Error fetching outstanding balance:', error.message)
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
    }
    await fetchOutstandingBalance()
  } catch (error) {
    console.error('⚠️ TenantPayment - Error fetching user data:', error.message)
    toast.error('Failed to load user data: ' + error.message)
  } finally {
    isLoading.value = false
  }
}

const openConfirmationDialog = () => {
  if (!store.invoiceId) {
    toast.error('No invoice assigned. Please try again.')
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

    if (!paymentIntentId) {
      console.log('🔍 No payment_intent_id, skipping verification')
      return
    }

    if (processedIntents.value.includes(paymentIntentId)) {
      console.log('🔍 Payment intent already processed:', paymentIntentId)
      return
    }

    console.log('🔍 Verifying payment:', paymentIntentId)
    processedIntents.value.push(paymentIntentId)

    const paymentIntent = await verifyPaymentIntent(paymentIntentId)
    if (paymentIntent.attributes.status !== 'succeeded') {
      console.error('⚠️ Payment not succeeded:', paymentIntent.attributes.status)
      toast.error('Payment not completed. Status: ' + paymentIntent.attributes.status)
      return
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payment')
      .select('payment_id, amount, payment_type, months')
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
    })

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
    })

    // Clear URL parameters to prevent re-processing
    window.history.replaceState({}, document.title, window.location.pathname)

    await fetchOutstandingBalance()
  } catch (err) {
    console.error('⚠️ Error verifying payment:', err.message)
    toast.error('Payment verification failed: ' + err.message)
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
    totalPayments: totalPayments.value,
  })
}

const handlePaymentProcessed = (event) => {
  console.log('🔔 Payment processed event:', event.detail)
  grandTotal.value = event.detail.outstandingBalance
  refreshBillingSummary.value++
  fetchOutstandingBalance()
}

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

onMounted(() => {
  console.log('✅ TenantPayment - Component mounted')
  window.addEventListener('payment-processed', handlePaymentProcessed)
  fetchUserData()
  checkPaymentCallback()
})

onUnmounted(() => {
  console.log('✅ TenantPayment - Component unmounted')
  window.removeEventListener('payment-processed', handlePaymentProcessed)
})
</script>

<template>
  <v-container fluid class="py-10">
    <v-progress-linear
      v-if="isLoading"
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
        <v-btn color="primary" block @click="openConfirmationDialog">Make Partial Payment</v-btn>
      </v-col>
    </v-row>

    <v-row v-if="store.invoiceId && !isLoading" justify="center" class="mt-4">
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
