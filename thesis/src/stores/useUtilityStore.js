import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { debounce } from 'lodash'

export const useUtilityStore = defineStore('utility', () => {
  const electricity = ref(0)
  const water = ref(0)
  const wifi = ref(0)
  const gcashNumber = ref('')
  const loading = ref(false)
  const errorMessage = ref('')
  const invoiceId = ref(null)

  const total = computed(() => {
    return electricity.value + water.value + wifi.value
  })

  const settingsId = ref('') // Store the actual UUID

  const fetchSettings = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('id, electricity_rate, water_rate, wifi_rate, gcash_number') // ✅ Fetch the UUID
        .single()

      if (error) throw error

      settingsId.value = data.id // ✅ Store the correct UUID
      electricity.value = Number(data.electricity_rate) || 0
      water.value = Number(data.water_rate) || 0
      wifi.value = Number(data.wifi_rate) || 0
      gcashNumber.value = data.gcash_number || ''
      console.log('✅ Settings fetched:', data)
    } catch (error) {
      console.error('⚠️ Error fetching utility settings:', error.message)
      errorMessage.value = error.message
    } finally {
      loading.value = false
    }
  }

  const saveSettings = async () => {
    try {
      loading.value = true

      console.log('Saving settings with the following values:', {
        electricity_rate: electricity.value || 0,
        water_rate: water.value || 0,
        wifi_rate: wifi.value || 0,
        gcash_number: gcashNumber.value, // Log the value before saving
      })

      const { error } = await supabase
        .from('settings')
        .update({
          electricity_rate: electricity.value || 0,
          water_rate: water.value || 0,
          wifi_rate: wifi.value || 0,
          gcash_number: gcashNumber.value || null, // Ensure it is correctly formatted
          updated_at: new Date().toISOString(),
        })
        .eq('id', settingsId.value) // Make sure you've set this correctly

      if (error) throw error

      console.log('✅ Settings saved successfully!')
      emitTotalAmountUpdated()
    } catch (error) {
      console.error('⚠️ Error saving settings:', error.message)
    } finally {
      loading.value = false
    }
  }

  // ⚙️ Update Invoice without 'user_id'
  const updateInvoice = async (invoiceId, totalAmount, isPaid = false) => {
    try {
      if (!invoiceId) {
        console.warn('⚠️ No invoice ID found, skipping update.')
        return
      }

      // Fetch existing invoice details
      const { data: existingInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('outstanding_balance, due_date, total_amount')
        .eq('invoice_id', invoiceId)
        .single()

      if (fetchError) throw fetchError

      const today = new Date().toISOString().slice(0, 10)
      let newOutstandingBalance = existingInvoice.outstanding_balance
      let newDueDate = existingInvoice.due_date

      // If the invoice is paid, reset the outstanding balance
      if (isPaid) {
        newOutstandingBalance = 0
        console.log('💰 Payment received! Resetting outstanding balance.')
      }
      // If due_date has passed, add total_amount to outstanding_balance
      else if (existingInvoice.due_date < today) {
        console.warn('⏳ Due date passed! Updating outstanding balance...')
        newOutstandingBalance += totalAmount

        // Set new due date 1 month ahead
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        newDueDate = nextMonth.toISOString().slice(0, 10)
      }

      // Update invoice in the database
      const { error } = await supabase
        .from('invoices')
        .update({
          total_amount: totalAmount,
          outstanding_balance: newOutstandingBalance,
          due_date: newDueDate, // Update due date if applicable
          status: isPaid ? 'paid' : 'pending',
        })
        .eq('invoice_id', invoiceId)

      if (error) throw error
      console.log('✅ Invoice updated successfully.')
    } catch (err) {
      console.error('⚠️ Error updating invoice:', err.message)
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
    saveSettings()
  }

  const fetchInvoiceId = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error || !user) throw new Error('No user is currently logged in.')

      // Fetch user's invoice_id and role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('invoice_id, role') // Fetch role as well
        .eq('user_id', user.id)
        .single()

      if (userError) throw userError

      // 🛑 Prevent admins from getting an invoice
      if (userData?.role === 'admin') {
        console.log('🛑 Admin detected. No invoice assigned.')
        return
      }

      // If user has no invoice, create a new one with due_date 1 month ahead
      if (!userData?.invoice_id) {
        console.warn('⚠️ No invoice found. Creating a new one...')

        // Calculate due date (1 month from today)
        const today = new Date()
        const nextMonth = new Date(today.setMonth(today.getMonth() + 1)).toISOString().slice(0, 10)

        // Insert a new invoice
        const { data: newInvoice, error: createError } = await supabase
          .from('invoices')
          .insert([
            {
              total_amount: 0, // No payment yet
              outstanding_balance: 0, // No overdue balance
              due_date: nextMonth, // Set due date to 1 month ahead
              status: 'pending',
            },
          ])
          .select('invoice_id')
          .single()

        if (createError) throw createError

        // Update user with the new invoice_id
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
    }
  }

  // Watch for changes to update invoice automatically
  watch(
    [electricity, water, wifi],
    debounce(() => {
      if (invoiceId.value) {
        console.log('🔄 Updating invoice...')
        updateInvoice(invoiceId.value, total.value)
      }
    }, 1000),
  )

  fetchInvoiceId()

  return {
    electricity,
    water,
    wifi,
    gcashNumber,
    total,
    loading,
    errorMessage,
    fetchSettings,
    saveSettings,
    updateInvoice,
    resetDefaults,
  }
})
