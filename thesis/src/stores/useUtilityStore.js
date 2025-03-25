// /stores/useUtilityStore.js
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { supabase } from '@/utils/supabase'

export const useUtilityStore = defineStore('utility', () => {
  // Reactive State
  const electricity = ref(0)
  const water = ref(0)
  const wifi = ref(0)
  const loading = ref(false)
  const errorMessage = ref('')

  // Computed Total
  const total = computed(() => {
    return electricity.value + water.value + wifi.value
  })

  // Fetch settings from Supabase
  const fetchSettings = async () => {
    loading.value = true
    errorMessage.value = ''
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('electricity_rate, water_rate, wifi_rate')
        .single()

      if (error) throw error

      // Set the reactive state
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

  // Save updated settings to Supabase
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
        .eq('id', 1) // Ensure you match the correct row

      if (error) throw error
      console.log('✅ Settings saved successfully!')

      // Emit event after saving
      emitTotalAmountUpdated()
    } catch (error) {
      console.error('⚠️ Error saving settings:', error.message)
    } finally {
      loading.value = false
    }
  }

  // Function to update invoice
  const updateInvoice = async (invoice_id, totalAmount) => {
    try {
      const { error } = await supabase.from('invoices').upsert(
        {
          invoice_id: invoice_id,
          total_amount: totalAmount,
          outstanding_balance: totalAmount,
          due_date: new Date().toISOString().slice(0, 10),
          status: 'Pending',
        },
        { onConflict: 'invoice_id' }, // Update if exists
      )

      if (error) throw error
      console.log('✅ Invoice updated successfully!')

      // Emit event after updating invoice
      emitTotalAmountUpdated()
    } catch (err) {
      console.error('⚠️ Error updating invoice:', err.message)
    }
  }

  // Emit total amount update event
  const emitTotalAmountUpdated = () => {
    const event = new CustomEvent('total-amount-updated', {
      detail: total.value,
    })
    window.dispatchEvent(event)
  }

  // Reset to default values
  const resetDefaults = () => {
    electricity.value = 1200
    water.value = 800
    wifi.value = 1000
    saveSettings()
  }

  // Watch for changes and update invoice automatically
  watch([electricity, water, wifi], () => {
    // Get current user ID from Supabase
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) updateInvoice(user.id, total.value)
    })
  })

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
