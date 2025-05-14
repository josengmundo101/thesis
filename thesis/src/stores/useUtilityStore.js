import { defineStore } from 'pinia'
import { supabase } from '@/utils/supabase'
import { computed, ref } from 'vue'

export const useUtilityStore = defineStore('utility', () => {
  const rent = ref(0)
  const electricity = ref(0)
  const water = ref(0)
  const wifi = ref(0)
  const tenantRates = ref({})
  const invoiceId = ref(null)
  const errorMessage = ref(null)

  const effectiveRates = computed(() => ({
    rent: tenantRates.value.rent_rate || rent.value || 0,
    electricity: tenantRates.value.electricity_rate || electricity.value || 0,
    water: tenantRates.value.water_rate || water.value || 0,
    wifi: tenantRates.value.wifi_rate || wifi.value || 0,
  }))

  const total = computed(() => {
    const sum =
      effectiveRates.value.rent +
      effectiveRates.value.water +
      effectiveRates.value.electricity +
      effectiveRates.value.wifi
    console.log('💰 Total calculated:', sum)
    return sum
  })

  async function withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message)
        if (attempt === maxRetries) {
          console.error('⚠️ Max retries reached:', error)
          throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`)
        }
        await new Promise((resolve) => setTimeout(resolve, delay * attempt))
      }
    }
  }

  async function validateSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error || !session) {
      console.error('⚠️ Invalid session:', error?.message)
      throw new Error('No active session')
    }
    return session
  }

  async function fetchSettings() {
    try {
      console.log('🔍 Fetching settings...')
      await validateSession()
      const { data, error } = await withRetry(() => supabase.from('settings').select('*').single())
      if (error) throw error
      rent.value = Number(data.rent_rate) || 0
      electricity.value = Number(data.electricity_rate) || 0
      water.value = Number(data.water_rate) || 0
      wifi.value = Number(data.wifi_rate) || 0
      console.log('✅ Settings fetched:', {
        rent: rent.value,
        electricity: electricity.value,
        water: water.value,
        wifi: wifi.value,
      })
    } catch (error) {
      console.error('⚠️ Error fetching settings:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to fetch settings: ' + error.message
    }
  }

  async function fetchTenantRates(userId) {
    try {
      console.log('🔍 Fetching tenant rates for user:', userId)
      await validateSession()
      const { data, error } = await withRetry(() =>
        supabase
          .from('tenant_rates')
          .select('rent_rate, electricity_rate, water_rate, wifi_rate')
          .eq('user_id', userId)
          .single(),
      )
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('🔍 No tenant rates found for user, using default rates:', userId)
          tenantRates.value = { rent_rate: 0, electricity_rate: 0, water_rate: 0, wifi_rate: 0 }
          return
        }
        throw error
      }
      tenantRates.value = {
        rent_rate: Number(data.rent_rate) || 0,
        electricity_rate: Number(data.electricity_rate) || 0,
        water_rate: Number(data.water_rate) || 0,
        wifi_rate: Number(data.wifi_rate) || 0,
      }
      console.log('✅ Tenant rates fetched:', tenantRates.value)
    } catch (error) {
      console.error('⚠️ Error fetching tenant rates:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to fetch tenant rates: ' + error.message
      tenantRates.value = { rent_rate: 0, electricity_rate: 0, water_rate: 0, wifi_rate: 0 }
    }
  }

  async function fetchInvoiceId() {
    try {
      console.log('🔍 Fetching invoice ID...')
      await validateSession()
      const {
        data: { user },
        error: authError,
      } = await withRetry(() => supabase.auth.getUser())
      if (authError || !user || !user.id) throw new Error('No user logged in or invalid user ID')
      console.log('✅ Auth user:', user.id)

      let { data: invoiceData, error: invoiceError } = await withRetry(() =>
        supabase
          .from('invoices')
          .select(
            'invoice_id, due_date, prepaid_balance, total_amount, outstanding_balance, arrears',
          )
          .eq('invoice_id', user.id)
          .single(),
      )

      if (invoiceError && invoiceError.code === 'PGRST116') {
        console.log('🔍 No invoice found, creating new invoice...')
        const { data: newInvoice, error: createError } = await withRetry(() =>
          supabase
            .from('invoices')
            .insert({
              invoice_id: user.id,
              total_amount: total.value || 0,
              outstanding_balance: 0,
              arrears: 0,
              prepaid_balance: 0,
              due_date: new Date().toISOString().split('T')[0],
              status: 'pending',
            })
            .select(
              'invoice_id, due_date, prepaid_balance, total_amount, outstanding_balance, arrears',
            )
            .single(),
        )
        if (createError) throw createError
        console.log('✅ New invoice created:', newInvoice)
        invoiceData = newInvoice
      } else if (invoiceError) {
        throw invoiceError
      }

      invoiceId.value = invoiceData.invoice_id
      console.log('✅ Invoice ID fetched or created:', invoiceId.value)

      if (!invoiceId.value) {
        throw new Error('Failed to set invoiceId: invoice_id is null or undefined')
      }

      await deductMonthlyPrepaidBalance(invoiceData)
    } catch (error) {
      console.error('⚠️ Error fetching invoice ID:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to fetch invoice: ' + error.message
      invoiceId.value = null
    }
  }

  async function deductMonthlyPrepaidBalance(invoiceData) {
    try {
      if (!invoiceData.due_date || !total.value || total.value <= 0) {
        console.log('🔍 Skipping deduction: Invalid due_date or total', {
          due_date: invoiceData.due_date,
          total: total.value,
        })
        return
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const dueDate = new Date(invoiceData.due_date)
      dueDate.setHours(0, 0, 0, 0)

      if (dueDate > today) {
        console.log('🔍 Skipping deduction: Due date is in the future', { dueDate, today })
        return
      }

      let prepaidBalance = Number(invoiceData.prepaid_balance) || 0
      let outstandingBalance = Number(invoiceData.outstanding_balance) || 0
      let arrears = Number(invoiceData.arrears) || 0
      let newDueDate = new Date(dueDate)

      console.log('🔍 Checking prepaid balance deduction:', {
        prepaidBalance,
        total: total.value,
        dueDate,
        today,
      })

      if (prepaidBalance >= total.value) {
        prepaidBalance -= total.value
        newDueDate.setMonth(newDueDate.getMonth() + 1)
        console.log('✅ Deducted one month:', {
          deducted: total.value,
          newPrepaidBalance: prepaidBalance,
          newDueDate: newDueDate.toISOString().split('T')[0],
        })
      } else {
        arrears += total.value - prepaidBalance
        prepaidBalance = 0
        newDueDate.setMonth(newDueDate.getMonth() + 1)
        console.log('⚠️ Insufficient prepaid balance, added to arrears:', {
          added: total.value - prepaidBalance,
          newArrears: arrears,
          newDueDate: newDueDate.toISOString().split('T')[0],
        })
      }

      const newStatus = computeInvoiceStatus({
        outstanding_balance: outstandingBalance,
        arrears,
        due_date: newDueDate.toISOString().split('T')[0],
      })
      console.log('✅ Calculated new status:', newStatus)

      const updateData = {
        prepaid_balance: prepaidBalance,
        due_date: newDueDate.toISOString().split('T')[0],
        outstanding_balance: outstandingBalance,
        arrears,
        status: newStatus,
      }
      console.log('🔍 Updating invoice with:', updateData)

      const { error: updateError } = await withRetry(() =>
        supabase.from('invoices').update(updateData).eq('invoice_id', invoiceData.invoice_id),
      )
      if (updateError) throw updateError

      console.log('✅ Invoice updated after deduction:', updateData)
      errorMessage.value =
        prepaidBalance >= total.value
          ? 'Successfully deducted one month from prepaid balance'
          : 'Insufficient prepaid balance, added to arrears'

      const { data: verifyData, error: verifyError } = await supabase
        .from('invoices')
        .select('prepaid_balance, outstanding_balance, arrears, status, due_date')
        .eq('invoice_id', invoiceData.invoice_id)
        .single()
      if (verifyError) throw verifyError
      console.log('✅ Verified invoice state:', verifyData)
    } catch (error) {
      console.error('⚠️ Error deducting prepaid balance:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to deduct prepaid balance: ' + error.message
    }
  }

  async function fetchInvoiceData(invoiceId) {
    try {
      if (!invoiceId) {
        console.error('⚠️ Invalid invoiceId:', invoiceId)
        throw new Error('Invoice ID is null or undefined')
      }

      console.log('🔍 Fetching invoice data for:', invoiceId)
      let { data, error } = await withRetry(() =>
        supabase
          .from('invoices')
          .select('total_amount, outstanding_balance, arrears, prepaid_balance, due_date, status')
          .eq('invoice_id', invoiceId)
          .single(),
      )

      if (error && error.code === 'PGRST116') {
        console.log('🔍 No invoice found for invoiceId:', invoiceId)
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()
        if (authError || !user || !user.id) throw new Error('No user logged in or invalid user ID')

        console.log('🔍 Creating new invoice for user:', user.id)
        const { data: newInvoice, error: createError } = await withRetry(() =>
          supabase
            .from('invoices')
            .insert({
              invoice_id: user.id,
              total_amount: total.value || 0,
              outstanding_balance: 0,
              arrears: 0,
              prepaid_balance: 0,
              due_date: new Date().toISOString().split('T')[0],
              status: 'pending',
            })
            .select('total_amount, outstanding_balance, arrears, prepaid_balance, due_date, status')
            .single(),
        )
        if (createError) throw createError
        console.log('✅ New invoice created:', newInvoice)
        data = newInvoice
      } else if (error) {
        throw error
      }

      if (!data) {
        throw new Error('No invoice data returned for invoiceId: ' + invoiceId)
      }

      const invoiceData = {
        total_amount: Number(data.total_amount) || 0,
        outstanding_balance: Number(data.outstanding_balance) || 0,
        arrears: Number(data.arrears) || 0,
        prepaid_balance: Number(data.prepaid_balance) || 0,
        due_date: data.due_date,
        status: data.status || 'pending',
      }
      console.log('✅ Invoice data fetched:', invoiceData)
      return invoiceData
    } catch (error) {
      console.error('⚠️ Error fetching invoice data:', {
        message: error.message,
        code: error.code,
        details: error.details,
        invoiceId,
      })
      errorMessage.value = 'Failed to fetch invoice data: ' + error.message
      return {
        total_amount: 0,
        outstanding_balance: 0,
        arrears: 0,
        prepaid_balance: 0,
        due_date: null,
        status: 'pending',
      }
    }
  }

  async function savePayment(paymentDetails) {
    try {
      console.log('💾 Saving payment:', paymentDetails)
      const { invoiceId, userId, amount, paymentMethod, paymentIntentId, paymentType, months } =
        paymentDetails
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Invalid payment amount')
      }
      const { data, error } = await withRetry(() =>
        supabase
          .from('payment')
          .insert({
            invoice_id: invoiceId,
            user_id: userId,
            amount,
            payment_method: paymentMethod,
            payment_intent_id: paymentIntentId,
            payment_type: paymentType || 'partial',
            months: paymentType === 'advance' ? months : null,
            status: 'pending',
          })
          .select('payment_id')
          .single(),
      )
      if (error) throw error
      console.log('✅ Payment saved:', data.payment_id)
      return data.payment_id
    } catch (error) {
      console.error('⚠️ Error saving payment:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to save payment: ' + error.message
      throw error
    }
  }

  function computeInvoiceStatus({ outstanding_balance, arrears, due_date }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dueDate = new Date(due_date)
    dueDate.setHours(0, 0, 0, 0)

    if (outstanding_balance <= 0 && arrears <= 0) {
      return 'approved' // Changed from 'paid' to 'approved'
    }
    return dueDate < today ? 'overdue' : 'pending'
  }

  async function processAdvancePayment(invoiceId, months, amount, paymentId) {
    try {
      console.log('💸 Processing advance payment:', { invoiceId, months, amount, paymentId })

      if (!Number.isInteger(months) || months <= 0) {
        throw new Error('Invalid months: Must be a positive integer')
      }
      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Invalid amount: Must be a positive number')
      }

      const { data: invoiceData, error: fetchError } = await withRetry(() =>
        supabase
          .from('invoices')
          .select('prepaid_balance, arrears, outstanding_balance, due_date, total_amount')
          .eq('invoice_id', invoiceId)
          .single(),
      )
      if (fetchError) throw fetchError
      if (!invoiceData) throw new Error('Invoice not found')

      console.log('✅ Current invoice state:', invoiceData)

      let remainingPayment = Number(amount)
      let newArrears = Number(invoiceData.arrears) || 0
      let newOutstandingBalance = Number(invoiceData.outstanding_balance) || 0
      let newPrepaidBalance = Number(invoiceData.prepaid_balance) || 0

      if (newArrears > 0) {
        const amountToClear = Math.min(remainingPayment, newArrears)
        newArrears -= amountToClear
        remainingPayment -= amountToClear
        console.log('✅ Cleared arrears:', { amountToClear, newArrears, remainingPayment })
      }

      if (remainingPayment > 0 && newOutstandingBalance > 0) {
        const amountToClear = Math.min(remainingPayment, newOutstandingBalance)
        newOutstandingBalance -= amountToClear
        remainingPayment -= amountToClear
        console.log('✅ Cleared outstanding balance:', {
          amountToClear,
          newOutstandingBalance,
          remainingPayment,
        })
      }

      if (newOutstandingBalance > 0) {
        newArrears += newOutstandingBalance
        console.log('✅ Moved remaining outstanding to arrears:', {
          moved: newOutstandingBalance,
          newArrears,
        })
        newOutstandingBalance = 0
      }

      if (remainingPayment > 0) {
        newPrepaidBalance += remainingPayment
        console.log('✅ Added to prepaid balance:', { remainingPayment, newPrepaidBalance })
      }

      let currentDueDate = invoiceData.due_date ? new Date(invoiceData.due_date) : new Date()
      if (isNaN(currentDueDate.getTime())) {
        console.warn('⚠️ Invalid current due_date, using today:', invoiceData.due_date)
        currentDueDate = new Date()
      }
      currentDueDate.setHours(0, 0, 0, 0)
      const newDueDate = new Date(currentDueDate)
      newDueDate.setMonth(currentDueDate.getMonth() + months)
      if (isNaN(newDueDate.getTime())) {
        throw new Error('Invalid new due_date calculated')
      }

      console.log('✅ Calculated new due_date:', {
        currentDueDate: currentDueDate.toISOString().split('T')[0],
        months,
        newDueDate: newDueDate.toISOString().split('T')[0],
      })

      const newStatus = computeInvoiceStatus({
        outstanding_balance: newOutstandingBalance,
        arrears: newArrears,
        due_date: newDueDate.toISOString().split('T')[0],
      })
      console.log('✅ Calculated new status:', newStatus)

      const updateData = {
        prepaid_balance: newPrepaidBalance,
        arrears: newArrears,
        outstanding_balance: newOutstandingBalance,
        due_date: newDueDate.toISOString().split('T')[0],
        status: newStatus,
      }
      console.log('🔍 Updating invoice with:', updateData)

      const { error: updateError } = await withRetry(() =>
        supabase.from('invoices').update(updateData).eq('invoice_id', invoiceId),
      )
      if (updateError) throw updateError

      const { data: verifyData, error: verifyError } = await supabase
        .from('invoices')
        .select('prepaid_balance, outstanding_balance, arrears, due_date, status')
        .eq('invoice_id', invoiceId)
        .single()
      if (verifyError) throw verifyError

      if (
        verifyData.prepaid_balance !== newPrepaidBalance ||
        verifyData.outstanding_balance !== newOutstandingBalance ||
        verifyData.arrears !== newArrears ||
        verifyData.status !== newStatus ||
        verifyData.due_date !== updateData.due_date
      ) {
        console.error('⚠️ Verification failed: Updated values do not match expected', {
          expected: updateData,
          actual: verifyData,
        })
        throw new Error('Invoice update verification failed')
      }
      console.log('✅ Verified invoice state:', verifyData)

      errorMessage.value = 'Advance payment processed successfully'
      return newPrepaidBalance
    } catch (error) {
      console.error('⚠️ Error processing advance payment:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to process advance payment: ' + error.message
      throw error
    }
  }

  async function processPartialPayment(invoiceId, amount, paymentId) {
    try {
      console.log('💸 Processing partial payment:', { invoiceId, amount, paymentId })

      if (!amount || amount <= 0 || isNaN(amount)) {
        throw new Error('Invalid amount: Must be a positive number')
      }

      const { data: invoiceData, error: fetchError } = await withRetry(() =>
        supabase
          .from('invoices')
          .select('outstanding_balance, arrears, prepaid_balance, due_date, total_amount')
          .eq('invoice_id', invoiceId)
          .single(),
      )
      if (fetchError) throw fetchError
      if (!invoiceData) throw new Error('Invoice not found')

      console.log('✅ Current invoice state:', invoiceData)

      let remainingPayment = Number(amount)
      let newArrears = Number(invoiceData.arrears) || 0
      let newOutstandingBalance = Number(invoiceData.outstanding_balance) || 0
      let newPrepaidBalance = Number(invoiceData.prepaid_balance) || 0

      if (newArrears > 0) {
        const amountToClear = Math.min(remainingPayment, newArrears)
        newArrears -= amountToClear
        remainingPayment -= amountToClear
        console.log('✅ Cleared arrears:', { amountToClear, newArrears, remainingPayment })
      }

      if (remainingPayment > 0 && newOutstandingBalance > 0) {
        const amountToClear = Math.min(remainingPayment, newOutstandingBalance)
        newOutstandingBalance -= amountToClear
        remainingPayment -= amountToClear
        console.log('✅ Cleared outstanding balance:', {
          amountToClear,
          newOutstandingBalance,
          remainingPayment,
        })
      }

      if (newOutstandingBalance > 0) {
        newArrears += newOutstandingBalance
        console.log('✅ Moved remaining outstanding to arrears:', {
          moved: newOutstandingBalance,
          newArrears,
        })
        newOutstandingBalance = 0
      }

      if (remainingPayment > 0) {
        newPrepaidBalance += remainingPayment
        console.log('✅ Added to prepaid balance:', { remainingPayment, newPrepaidBalance })
      }

      let currentDueDate = invoiceData.due_date ? new Date(invoiceData.due_date) : new Date()
      if (isNaN(currentDueDate.getTime())) {
        console.warn('⚠️ Invalid current due_date, using today:', invoiceData.due_date)
        currentDueDate = new Date()
      }
      currentDueDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let newDueDate = new Date(currentDueDate)
      if (newArrears <= 0 && newOutstandingBalance <= 0 && currentDueDate < today) {
        newDueDate.setMonth(currentDueDate.getMonth() + 1)
        console.log('✅ Extended due_date for cleared invoice:', {
          oldDueDate: currentDueDate.toISOString().split('T')[0],
          newDueDate: newDueDate.toISOString().split('T')[0],
        })
      }

      const newStatus = computeInvoiceStatus({
        outstanding_balance: newOutstandingBalance,
        arrears: newArrears,
        due_date: newDueDate.toISOString().split('T')[0],
      })
      console.log('✅ Calculated new status:', newStatus)

      const updateData = {
        outstanding_balance: newOutstandingBalance,
        arrears: newArrears,
        prepaid_balance: newPrepaidBalance,
        due_date: newDueDate.toISOString().split('T')[0],
        status: newStatus,
      }
      console.log('🔍 Updating invoice with:', updateData)

      const { error: updateError } = await withRetry(() =>
        supabase.from('invoices').update(updateData).eq('invoice_id', invoiceId),
      )
      if (updateError) throw updateError

      const { data: verifyData, error: verifyError } = await supabase
        .from('invoices')
        .select('prepaid_balance, outstanding_balance, arrears, status, due_date')
        .eq('invoice_id', invoiceId)
        .single()
      if (verifyError) throw verifyError

      if (
        verifyData.prepaid_balance !== newPrepaidBalance ||
        verifyData.outstanding_balance !== newOutstandingBalance ||
        verifyData.arrears !== newArrears ||
        verifyData.status !== newStatus ||
        verifyData.due_date !== updateData.due_date
      ) {
        console.error('⚠️ Verification failed: Updated values do not match expected', {
          expected: updateData,
          actual: verifyData,
        })
        throw new Error('Invoice update verification failed')
      }
      console.log('✅ Verified invoice state:', verifyData)

      errorMessage.value = 'Partial payment processed successfully'
      return newPrepaidBalance
    } catch (error) {
      console.error('⚠️ Error processing partial payment:', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      errorMessage.value = 'Failed to process partial payment: ' + error.message
      throw error
    }
  }

  return {
    rent,
    electricity,
    water,
    wifi,
    tenantRates,
    effectiveRates,
    total,
    invoiceId,
    errorMessage,
    fetchSettings,
    fetchTenantRates,
    fetchInvoiceId,
    deductMonthlyPrepaidBalance,
    fetchInvoiceData,
    savePayment,
    processAdvancePayment,
    processPartialPayment,
  }
})
