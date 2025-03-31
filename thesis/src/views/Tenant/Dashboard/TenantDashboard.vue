<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import BillingCard from './components/BillingCard.vue'
import SummaryCard from './components/SummaryCard.vue'
import NotificationCard from './components/NotificationCard.vue'
import { useNotificationStore } from '@/stores/useNotificationStore'
// State
const summary = ref({
  balance: 0,
  dueDate: '',
})

const notificationStore = useNotificationStore()

const tenantName = ref('Tenant') // Default to "Tenant"

// Fetch Tenant Details
const fetchTenantDetails = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('No user is currently logged in.')

    console.log('✅ User ID:', user.id)

    const { data: tenantData, error: tenantError } = await supabase
      .from('users')
      .select(
        `firstname, lastname, invoice_id, invoices (total_amount, outstanding_balance, due_date)`,
      )
      .eq('user_id', user.id)
      .single()

    if (tenantError) throw tenantError
    console.log('✅ Tenant Data:', tenantData)

    if (tenantData) {
      tenantName.value = `${tenantData.firstname} ${tenantData.lastname}`

      if (tenantData.invoices) {
        summary.value = {
          balance: tenantData.invoices.outstanding_balance,
          dueDate: new Date(tenantData.invoices.due_date).toLocaleDateString(),
        }
      }
    }
  } catch (error) {
    console.error('🛑 Error fetching tenant details:', error.message)
  }
}

// Fetch Data on Mount
onMounted(() => {
  fetchTenantDetails()
  notificationStore.loadNotifications() // ✅ Load notifications
  console.log('📢 Tenant Notifications:', notificationStore.notifications) // ✅ Log state
})
</script>

<template>
  <v-container class="mt-8">
    <v-row class="mb-6">
      <v-col cols="12" class="hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white">Welcome, {{ tenantName }}!</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Here's a summary of your current billing status and upcoming payments.
        </p>
      </v-col>
    </v-row>

    <!-- Billing & Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <BillingCard />
      </v-col>

      <v-col cols="12" md="6">
        <SummaryCard :balance="summary.balance" :dueDate="summary.dueDate" />
      </v-col>
    </v-row>

    <!-- Notifications -->
    <v-row>
      <v-col cols="12">
        <NotificationCard :notifications="notificationStore.notifications" />
      </v-col>
    </v-row>
  </v-container>
</template>
