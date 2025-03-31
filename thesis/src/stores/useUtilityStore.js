import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { debounce } from 'lodash'

export const useUtilityStore = defineStore('utility', () => {
  const electricity = ref(0)
  const water = ref(0)
  const wifi = ref(0)
  const loading = ref(false)
  const errorMessage = ref('')
  const invoiceId = ref(null)

  const total = computed(() => {
    return electricity.value + water.value + wifi.value
  })

  const fetchSettings = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('electricity_rate, water_rate, wifi_rate')
        .single()

      if (error) throw error

      electricity.value = Number(data.electricity_rate) || 0
      water.value = Number(data.water_rate) || 0
      wifi.value = Number(data.wifi_rate) || 0
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
      const { error } = await supabase
        .from('settings')
        .update({
          electricity_rate: electricity.value,
          water_rate: water.value,
          wifi_rate: wifi.value,
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1)

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
  const updateInvoice = async (invoiceId, totalAmount, outstandingBalance) => {
    try {
      const { error } = await supabase.from('invoices').upsert(
        {
          invoice_id: invoiceId, // Assuming invoice_id is the primary key
          total_amount: totalAmount,
          outstanding_balance: outstandingBalance,
          due_date: new Date().toISOString().slice(0, 10),
          status: 'pending',
        },
        { onConflict: 'invoice_id' },
      )

      if (error) throw error
      console.log('✅ Invoice updated successfully!')
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

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('invoice_id')
        .eq('user_id', user.id)
        .single()

      if (userError) throw userError

      // Create invoice if none exists
      if (!userData?.invoice_id) {
        console.warn('⚠️ No invoice found. Creating a new one...')

        // Insert a new invoice
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

        // Update user with the new invoice_id
        const { error: updateError } = await supabase
          .from('users')
          .update({ invoice_id: newInvoice.invoice_id })
          .eq('user_id', user.id)

        if (updateError) throw updateError

        invoiceId.value = newInvoice.invoice_id
        console.log('✅ New Invoice ID created:', invoiceId.value)
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
        updateInvoice(invoiceId.value, total.value, total.value)
      }
    }, 1000),
  )

  fetchInvoiceId()

  return {
    electricity,
    water,
    wifi,
    total,
    loading,
    errorMessage,
    fetchSettings,
    saveSettings,
    updateInvoice,
    resetDefaults,
  }
})
