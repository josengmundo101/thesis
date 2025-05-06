import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { debounce } from 'lodash'

export const useUtilityStore = defineStore('utility', () => {
  const electricity = ref(0)
  const water = ref(0)
  const wifi = ref(0)
  const rent = ref(0)
  const gcashNumber = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const invoiceId = ref(null)
  const settingsId = ref('')
  const tenantRates = ref(null)

  const fetchSettings = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, electricity_rate, water_rate, wifi_rate, rent_rate, gcash_number')
        .single()
      if (error) throw error

      settingsId.value = data.id
      electricity.value = Number(data.electricity_rate) || 0
      water.value = Number(data.water_rate) || 0
      wifi.value = Number(data.wifi_rate) || 0
      rent.value = Number(data.rent_rate) || 0
      gcashNumber.value = data.gcash_number || ''
      console.log('✅ Settings fetched:', data)
    } catch (error) {
      console.error('⚠️ Error fetching utility settings:', error.message)
      errorMessage.value = 'Failed to fetch default rates: ' + error.message
    } finally {
      loading.value = false
    }
  }

  const fetchTenantRates = async (userId) => {
    if (!userId) {
      console.warn('⚠️ No userId provided for fetchTenantRates')
      tenantRates.value = null
      errorMessage.value = 'No tenant ID provided for custom rates.'
      return
    }
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('tenant_rates')
        .select('rent_rate, water_rate, electricity_rate, wifi_rate')
        .eq('user_id', userId)
        .maybeSingle()
      if (error) throw error
      tenantRates.value = data
      if (!data) {
        console.log('⚠️ No custom rates found for user_id:', userId)
        errorMessage.value = `No custom rates found for tenant ID: ${userId}.`
      } else {
        console.log('✅ Tenant rates fetched for user_id:', userId, data)
      }
    } catch (error) {
      console.error('⚠️ Error fetching tenant rates:', error.message)
      tenantRates.value = null
      errorMessage.value = `Failed to fetch custom rates: ${error.message}`
    } finally {
      loading.value = false
    }
  }

  const fetchInvoiceData = async (invoiceId) => {
    try {
      if (!invoiceId) {
        console.warn('⚠️ No invoice ID provided for fetchInvoiceData')
        errorMessage.value = 'No invoice ID provided.'
        return null
      }
      const { data, error } = await supabase
        .from('invoices')
        .select('total_amount, outstanding_balance, arrears, prepaid_balance, due_date, status')
        .eq('invoice_id', invoiceId)
        .single()
      if (error) throw error
      console.log('✅ Invoice data fetched:', {
        invoice_id: invoiceId,
        total_amount: data.total_amount,
        outstanding_balance: data.outstanding_balance,
        arrears: data.arrears,
        prepaid_balance: data.prepaid_balance,
        due_date: data.due_date,
        status: data.status,
      })
      return data
    } catch (error) {
      console.error('⚠️ Error fetching invoice data:', error.message)
      errorMessage.value = 'Failed to fetch invoice data: ' + error.message
      return null
    }
  }

  const savePayment = async (paymentData) => {
    try {
      const { invoiceId, userId, amount, paymentMethod, paymentIntentId, paymentType, months } =
        paymentData
      if (!invoiceId || !userId || !amount || !paymentMethod || !paymentIntentId || !paymentType) {
        console.warn('⚠️ Invalid payment data:', paymentData)
        errorMessage.value = 'Missing required payment data.'
        throw new Error('Missing required payment data.')
      }
      if (!['advance', 'partial'].includes(paymentType)) {
        console.warn('⚠️ Invalid payment_type:', paymentType)
        errorMessage.value = 'Payment type must be "advance" or "partial".'
        throw new Error('Invalid payment type.')
      }

      const paymentRecord = {
        amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        status: 'pending',
        user_id: userId,
        invoice_id: invoiceId,
        payment_intent_id: paymentIntentId,
        payment_type: paymentType,
      }

      if (paymentType === 'advance') {
        if (!Number.isInteger(months) || months < 1) {
          console.warn('⚠️ Invalid months for advance payment:', months)
          errorMessage.value = 'Months must be a positive integer for advance payments.'
          throw new Error('Invalid months.')
        }
        paymentRecord.months = months
      }

      console.log('💸 Saving payment:', paymentRecord)

      const { data, error } = await supabase
        .from('payment')
        .insert([paymentRecord])
        .select('payment_id')
        .single()
      if (error) {
        console.error('⚠️ Failed to save payment:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log('✅ Payment saved:', {
        paymentId: data.payment_id,
        amount,
        paymentType,
        months: paymentRecord.months,
      })
      return data.payment_id
    } catch (error) {
      console.error('⚠️ Error saving payment:', error.message)
      errorMessage.value = 'Failed to save payment: ' + error.message
      throw error
    }
  }

  const effectiveRates = computed(() => {
    const rates = {
      rent: tenantRates.value?.rent_rate ?? rent.value,
      water: tenantRates.value?.water_rate ?? water.value,
      electricity: tenantRates.value?.electricity_rate ?? electricity.value,
      wifi: tenantRates.value?.wifi_rate ?? wifi.value,
    }
    console.log('🔍 Effective rates:', rates, 'tenantRates:', tenantRates.value, 'defaultRates:', {
      rent: rent.value,
      water: water.value,
      electricity: electricity.value,
      wifi: wifi.value,
    })
    return rates
  })

  const total = computed(() => {
    const sum =
      effectiveRates.value.rent +
      effectiveRates.value.water +
      effectiveRates.value.electricity +
      effectiveRates.value.wifi
    console.log('💰 Total calculated:', sum)
    return sum
  })

  const saveSettings = async () => {
    try {
      loading.value = true
      console.log('Saving settings with the following values:', {
        electricity_rate: electricity.value,
        water_rate: water.value,
        wifi_rate: wifi.value,
        rent_rate: rent.value,
        gcash_number: gcashNumber.value,
      })

      const { error } = await supabase
        .from('settings')
        .update({
          electricity_rate: electricity.value,
          water_rate: water.value,
          wifi_rate: wifi.value,
          rent_rate: rent.value,
          gcash_number: gcashNumber.value || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settingsId.value)
      if (error) throw error
      console.log('✅ Settings saved successfully!')
      emitTotalAmountUpdated()
    } catch (error) {
      console.error('⚠️ Error saving settings:', error.message)
      errorMessage.value = 'Failed to save settings: ' + error.message
    } finally {
      loading.value = false
    }
  }

  const updateInvoice = async (invoiceId, totalAmount, isPaid = false) => {
    try {
      if (!invoiceId) {
        console.warn('⚠️ No invoice ID found, skipping update.')
        errorMessage.value = 'No invoice ID provided for update.'
        return
      }

      const { data: existingInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('outstanding_balance, due_date, total_amount, arrears, prepaid_balance, status')
        .eq('invoice_id', invoiceId)
        .single()
      if (fetchError) throw fetchError

      const today = new Date().toISOString().slice(0, 10)
      let newOutstandingBalance = existingInvoice.outstanding_balance
      let newArrears = existingInvoice.arrears
      let newPrepaidBalance = existingInvoice.prepaid_balance
      let newDueDate = existingInvoice.due_date
      let newStatus = existingInvoice.status

      if (isPaid) {
        newOutstandingBalance = 0
        newArrears = 0
        newStatus = 'paid'
        console.log('💰 Payment received! Clearing outstanding balance and arrears.')
      } else {
        if (
          existingInvoice.due_date < today &&
          existingInvoice.status !== 'paid' &&
          newPrepaidBalance < totalAmount
        ) {
          console.warn('⏳ Due date passed! Updating outstanding balance and arrears...')
          newOutstandingBalance += totalAmount
          newArrears += totalAmount
          const nextMonth = new Date()
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          newDueDate = nextMonth.toISOString().slice(0, 10)
          newStatus = 'overdue'
        }
        if (newPrepaidBalance >= totalAmount) {
          newPrepaidBalance -= totalAmount
          newOutstandingBalance = 0
          newArrears = 0
          newStatus = 'paid'
          console.log('💸 Applied prepaid balance:', newPrepaidBalance)
        }
      }

      const { error } = await supabase
        .from('invoices')
        .update({
          total_amount: totalAmount,
          outstanding_balance: newOutstandingBalance,
          arrears: newArrears,
          prepaid_balance: newPrepaidBalance,
          due_date: newDueDate,
          status: newStatus,
        })
        .eq('invoice_id', invoiceId)
      if (error) throw error
      console.log('✅ Invoice updated:', {
        invoiceId,
        totalAmount,
        outstandingBalance: newOutstandingBalance,
        arrears: newArrears,
        prepaidBalance: newPrepaidBalance,
        dueDate: newDueDate,
        status: newStatus,
      })
    } catch (error) {
      console.error('⚠️ Error updating invoice:', error.message)
      errorMessage.value = 'Failed to update invoice: ' + error.message
    }
  }

  const processPartialPayment = async (invoiceId, paymentAmount, paymentId) => {
    try {
      if (!invoiceId) {
        console.warn('⚠️ No invoice ID for partial payment.')
        errorMessage.value = 'No invoice ID provided for payment.'
        throw new Error('No invoice ID provided.')
      }
      if (paymentAmount <= 0 || isNaN(paymentAmount)) {
        errorMessage.value = 'Invalid payment amount. Must be greater than zero.'
        throw new Error(errorMessage.value)
      }
      if (!paymentId) {
        console.warn('⚠️ No payment ID for partial payment.')
        errorMessage.value = 'No payment ID provided.'
        throw new Error('No payment ID provided.')
      }

      console.log('🔄 Starting partial payment:', { invoiceId, paymentAmount, paymentId })

      const { data: payment, error: paymentError } = await supabase
        .from('payment')
        .select('amount, status, payment_type')
        .eq('payment_id', paymentId)
        .eq('invoice_id', invoiceId)
        .single()
      if (paymentError || !payment) {
        console.error('⚠️ Payment not found or error:', paymentError?.message)
        errorMessage.value = 'Payment record not found.'
        throw new Error('Payment record not found.')
      }
      if (payment.amount !== paymentAmount) {
        console.warn('⚠️ Payment amount mismatch:', {
          dbAmount: payment.amount,
          inputAmount: paymentAmount,
        })
        errorMessage.value = 'Payment amount mismatch.'
        throw new Error('Payment amount mismatch.')
      }
      if (payment.status === 'approved') {
        console.warn('⚠️ Payment already processed:', { paymentId })
        errorMessage.value = 'Payment already processed.'
        throw new Error('Payment already processed.')
      }
      if (payment.payment_type !== 'partial') {
        console.warn('⚠️ Invalid payment type for partial payment:', payment.payment_type)
        errorMessage.value = 'Payment type must be "partial".'
        throw new Error('Invalid payment type.')
      }

      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('outstanding_balance, arrears, prepaid_balance, total_amount, status')
        .eq('invoice_id', invoiceId)
        .single()
      if (fetchError) {
        console.error('⚠️ Failed to fetch invoice:', fetchError.message)
        errorMessage.value = 'Failed to fetch invoice: ' + fetchError.message
        throw fetchError
      }

      console.log('📊 Current invoice:', {
        outstanding_balance: invoice.outstanding_balance,
        arrears: invoice.arrears,
        prepaid_balance: invoice.prepaid_balance,
        total_amount: invoice.total_amount,
        status: invoice.status,
      })

      let newOutstandingBalance = invoice.outstanding_balance
      let newArrears = invoice.arrears
      let newPrepaidBalance = invoice.prepaid_balance || 0
      let remainingPayment = Number(paymentAmount)
      let newStatus = invoice.status

      console.log('🔍 Applying to outstanding_balance:', {
        remainingPayment,
        newOutstandingBalance,
      })
      if (remainingPayment >= newOutstandingBalance) {
        remainingPayment -= newOutstandingBalance
        newOutstandingBalance = 0
        console.log('✅ Cleared outstanding_balance. Remaining:', remainingPayment)
      } else {
        newOutstandingBalance -= remainingPayment
        remainingPayment = 0
        console.log('✅ Reduced outstanding_balance to:', newOutstandingBalance)
      }

      if (remainingPayment > 0 && newArrears > 0) {
        console.log('🔍 Applying to arrears:', { remainingPayment, newArrears })
        if (remainingPayment >= newArrears) {
          remainingPayment -= newArrears
          newArrears = 0
          console.log('✅ Cleared arrears. Remaining:', remainingPayment)
        } else {
          newArrears -= remainingPayment
          remainingPayment = 0
          console.log('✅ Reduced arrears to:', newArrears)
        }
      }

      if (remainingPayment > 0) {
        newPrepaidBalance += remainingPayment
        console.log('💸 Added to prepaid_balance:', { added: remainingPayment, newPrepaidBalance })
      } else {
        console.log('✅ No excess payment. Prepaid_balance unchanged:', newPrepaidBalance)
      }

      if (newOutstandingBalance === 0 && invoice.total_amount <= paymentAmount) {
        newStatus = 'paid'
      } else {
        newStatus = 'pending'
      }

      console.log('📊 New invoice state:', {
        outstandingBalance: newOutstandingBalance,
        arrears: newArrears,
        prepaidBalance: newPrepaidBalance,
        status: newStatus,
      })

      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          outstanding_balance: newOutstandingBalance,
          arrears: newArrears,
          prepaid_balance: newPrepaidBalance,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('invoice_id', invoiceId)
      if (updateError) {
        console.error('⚠️ Failed to update invoice:', updateError.message)
        errorMessage.value = 'Failed to update invoice: ' + updateError.message
        throw updateError
      }

      console.log('✅ Partial payment processed:', {
        invoiceId,
        paymentAmount,
        paymentId,
        outstandingBalance: newOutstandingBalance,
        arrears: newArrears,
        prepaidBalance: newPrepaidBalance,
        status: newStatus,
      })

      const event = new CustomEvent('payment-processed', {
        detail: { invoiceId, outstandingBalance: newOutstandingBalance },
      })
      window.dispatchEvent(event)

      return newOutstandingBalance
    } catch (error) {
      console.error('⚠️ Error processing partial payment:', error.message)
      errorMessage.value = 'Failed to process partial payment: ' + error.message
      throw error
    }
  }

  const processAdvancePayment = async (invoiceId, months, paymentAmount, paymentId) => {
    try {
      if (!invoiceId || !paymentId) {
        errorMessage.value = 'Missing invoice or payment ID.'
        throw new Error('Missing invoice or payment ID.')
      }
      if (!months || months < 1) {
        errorMessage.value = 'Months must be at least 1.'
        throw new Error('Invalid months.')
      }

      console.log('🔄 Processing advance payment:', { invoiceId, months, paymentAmount, paymentId })

      const { data: payment, error: paymentError } = await supabase
        .from('payment')
        .select('amount, status, payment_type, months')
        .eq('payment_id', paymentId)
        .eq('invoice_id', invoiceId)
        .single()
      if (paymentError || !payment) {
        console.error('⚠️ Payment not found:', paymentError?.message)
        errorMessage.value = 'Payment record not found.'
        throw new Error('Payment record not found.')
      }
      if (payment.status === 'approved') {
        console.warn('⚠️ Payment already processed:', { paymentId })
        errorMessage.value = 'Payment already processed.'
        throw new Error('Payment already processed.')
      }
      if (payment.amount !== paymentAmount) {
        console.error('⚠️ Payment amount mismatch:', {
          dbAmount: payment.amount,
          inputAmount: paymentAmount,
        })
        errorMessage.value = `Payment amount mismatch. Expected: ${paymentAmount}, Found: ${payment.amount}`
        throw new Error(errorMessage.value)
      }
      if (payment.payment_type !== 'advance') {
        console.error('⚠️ Invalid payment type:', {
          expected: 'advance',
          found: payment.payment_type,
        })
        errorMessage.value = `Invalid payment type. Expected: advance, Found: ${payment.payment_type}`
        throw new Error(errorMessage.value)
      }
      if (payment.months !== months) {
        console.warn('⚠️ Months mismatch:', {
          dbMonths: payment.months,
          inputMonths: months,
        })
        months = payment.months
      }

      const totalPerMonth = total.value
      const totalAdvance = totalPerMonth * months
      if (paymentAmount < totalAdvance) {
        console.error('⚠️ Insufficient payment amount:', {
          paymentAmount,
          required: totalAdvance,
        })
        errorMessage.value = `Payment amount (${paymentAmount}) is less than required for ${months} months (${totalAdvance}).`
        throw new Error(errorMessage.value)
      }

      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select('outstanding_balance, arrears, prepaid_balance, due_date, total_amount')
        .eq('invoice_id', invoiceId)
        .single()
      if (fetchError) {
        console.error('⚠️ Failed to fetch invoice:', fetchError.message)
        errorMessage.value = 'Failed to fetch invoice: ' + fetchError.message
        throw fetchError
      }

      console.log('📊 Current invoice:', {
        invoice_id: invoiceId,
        outstanding_balance: invoice.outstanding_balance,
        arrears: invoice.arrears,
        prepaid_balance: invoice.prepaid_balance,
        total_amount: invoice.total_amount,
        due_date: invoice.due_date,
      })

      let newOutstandingBalance = invoice.outstanding_balance
      let newArrears = invoice.arrears
      let newPrepaidBalance = invoice.prepaid_balance || 0
      let remainingPayment = Number(paymentAmount)

      if (remainingPayment >= newOutstandingBalance) {
        remainingPayment -= newOutstandingBalance
        newOutstandingBalance = 0
        console.log('✅ Cleared outstanding_balance. Remaining:', remainingPayment)
      } else {
        newOutstandingBalance -= remainingPayment
        remainingPayment = 0
        console.log('✅ Reduced outstanding_balance to:', newOutstandingBalance)
      }

      if (remainingPayment > 0 && newArrears > 0) {
        if (remainingPayment >= newArrears) {
          remainingPayment -= newArrears
          newArrears = 0
          console.log('✅ Cleared arrears. Remaining:', remainingPayment)
        } else {
          newArrears -= remainingPayment
          remainingPayment = 0
          console.log('✅ Reduced arrears to:', newArrears)
        }
      }

      if (remainingPayment > 0) {
        newPrepaidBalance += remainingPayment
        console.log('💸 Added to prepaid_balance:', { added: remainingPayment, newPrepaidBalance })
      } else {
        console.log('✅ No excess payment. Prepaid_balance unchanged:', newPrepaidBalance)
      }

      const dueDate = new Date(invoice.due_date)
      dueDate.setMonth(dueDate.getMonth() + months)
      const newDueDate = dueDate.toISOString().slice(0, 10)

      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update({
          outstanding_balance: newOutstandingBalance,
          arrears: newArrears,
          prepaid_balance: newPrepaidBalance,
          due_date: newDueDate,
          status: newOutstandingBalance > 0 ? 'pending' : 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('invoice_id', invoiceId)
        .select()
        .single()
      if (updateError) {
        console.error('⚠️ Failed to update invoice:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        })
        errorMessage.value = `Failed to update invoice: ${updateError.message}`
        throw updateError
      }

      console.log('✅ Advance payment processed:', {
        invoiceId,
        months,
        paymentAmount,
        outstandingBalance: newOutstandingBalance,
        arrears: newArrears,
        prepaidBalance: newPrepaidBalance,
        dueDate: newDueDate,
        updatedInvoice,
      })

      const event = new CustomEvent('payment-processed', {
        detail: { invoiceId, outstandingBalance: newOutstandingBalance },
      })
      window.dispatchEvent(event)

      return newOutstandingBalance
    } catch (error) {
      console.error('⚠️ Error processing advance payment:', {
        message: error.message,
        stack: error.stack,
      })
      errorMessage.value = 'Failed to process advance payment: ' + error.message
      throw error
    }
  }

  const emitTotalAmountUpdated = () => {
    const event = new CustomEvent('total-amount-updated', {
      detail: total.value,
    })
    window.dispatchEvent(event)
  }

  const resetDefaults = () => {
    electricity.value = 1200
    water.value = 800
    wifi.value = 1000
    rent.value = 2500
    saveSettings()
  }

  const fetchInvoiceId = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) throw new Error('No user is currently logged in.')

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('invoice_id, role')
        .eq('user_id', user.id)
        .single()
      if (userError) throw userError

      if (userData?.role === 'admin') {
        console.log('🛑 Admin detected. No invoice assigned.')
        invoiceId.value = null
        return
      }

      if (!userData?.invoice_id) {
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

        const { error: updateError } = await supabase
          .from('users')
          .update({ invoice_id: newInvoice.invoice_id })
          .eq('user_id', user.id)
        if (updateError) throw updateError

        invoiceId.value = newInvoice.invoice_id
        console.log('✅ New Invoice ID created with due date:', nextMonth)
      } else {
        invoiceId.value = userData.invoice_id
        console.log('✅ Fetched Invoice ID:', invoiceId.value)
      }
    } catch (error) {
      console.error('⚠️ Error fetching or creating invoice ID:', error.message)
      errorMessage.value = 'Failed to fetch or create invoice ID: ' + error.message
    }
  }

  watch(
    [electricity, water, wifi, rent],
    debounce(() => {
      if (invoiceId.value) {
        console.log('🔄 Updating invoice with total:', total.value)
        updateInvoice(invoiceId.value, total.value)
      }
    }, 1000),
  )

  fetchInvoiceId()

  return {
    electricity,
    water,
    wifi,
    rent,
    gcashNumber,
    total,
    loading,
    errorMessage,
    settingsId,
    tenantRates,
    fetchSettings,
    saveSettings,
    updateInvoice,
    processPartialPayment,
    processAdvancePayment,
    savePayment,
    resetDefaults,
    fetchTenantRates,
    effectiveRates,
    invoiceId,
    fetchInvoiceData,
  }
})
