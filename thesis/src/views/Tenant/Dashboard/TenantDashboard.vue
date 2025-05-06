<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import BillingCard from './components/BillingCard.vue'
import SummaryCard from './components/SummaryCard.vue'
import NotificationCard from './components/NotificationCard.vue'
import TenantHistory from './components/TenantHistory.vue'

const summary = ref({ balance: 0, arrears: 0, prepaidBalance: 0, dueDate: '' })
const tenantName = ref('Tenant')
const userId = ref(null)
const notifications = ref([])
const tenant = ref(null)

const fetchTenantDetails = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('No user is currently logged in.')
    userId.value = user.id
    console.log('TenantDashboard - Auth User ID:', userId.value)

    const { data: tenantData, error: tenantError } = await supabase
      .from('users')
      .select(
        `firstname, lastname, user_id, invoice_id, invoices (total_amount, outstanding_balance, arrears, prepaid_balance, due_date)`,
      )
      .eq('user_id', userId.value)
      .single()

    if (tenantError) throw tenantError
    console.log('TenantDashboard - Tenant Data:', JSON.stringify(tenantData, null, 2))

    if (tenantData) {
      tenantName.value = `${tenantData.firstname} ${tenantData.lastname}`
      tenant.value = { user_id: tenantData.user_id }
      if (tenantData.invoices) {
        summary.value = {
          balance: tenantData.invoices.outstanding_balance,
          arrears: tenantData.invoices.arrears,
          prepaidBalance: tenantData.invoices.prepaid_balance,
          dueDate: new Date(tenantData.invoices.due_date).toLocaleDateString(),
        }
      }
      console.log('TenantDashboard - Tenant set for BillingCard:', tenant.value)
    }
  } catch (error) {
    console.error('TenantDashboard - Error fetching tenant details:', error.message)
  }
}

const fetchNotifications = async () => {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(50)
    if (error) throw error
    notifications.value = data
    console.log(
      'TenantDashboard - Fetched notifications from Supabase:',
      JSON.stringify(notifications.value, null, 2),
    )
  } catch (error) {
    console.error('TenantDashboard - Error fetching notifications:', error)
  }
}

onMounted(() => {
  const subscription = supabase
    .channel('notifications-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      },
      (payload) => {
        const newNotification = payload.new
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (newNotification.user_id === user.id) {
            notifications.value = [newNotification, ...notifications.value].slice(0, 50)
          }
        })
      },
    )
    .subscribe()

  fetchTenantDetails()
  fetchNotifications()

  return () => {
    supabase.removeChannel(subscription)
  }
})

const clearNotifications = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('No user is currently logged in.')

    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('tenant_identifier', user.id)
      .eq('status', 'unread')

    if (error) throw error

    notifications.value = []
    console.log('TenantDashboard - Cleared notifications for user:', user.id)
  } catch (error) {
    console.error('TenantDashboard - Error clearing notifications:', error.message)
  }
}

const tenantNotifications = computed(() => {
  if (!userId.value) return []
  const filtered = notifications.value.filter(
    (notification) => notification.tenant_identifier === userId.value,
  )
  console.log(
    'TenantDashboard - Computed tenantNotifications for user',
    userId.value,
    ':',
    JSON.stringify(filtered, null, 2),
  )
  return filtered
})
</script>

<template>
  <v-container class="mt-8">
    <v-row class="mb-3">
      <v-col cols="12" class="hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white">Welcome, {{ tenantName }}!</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Here's a summary of your current billing status and upcoming payments.
        </p>
      </v-col>
    </v-row>

    <v-row class="mb-3">
      <v-col cols="12" md="6">
        <BillingCard :tenant="tenant" />
      </v-col>
      <v-col cols="12" md="6">
        <SummaryCard
          :balance="summary.balance"
          :arrears="summary.arrears"
          :prepaidBalance="summary.prepaidBalance"
          :dueDate="summary.dueDate"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <NotificationCard
          :notifications="tenantNotifications"
          @clear-notifications="clearNotifications"
        />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <TenantHistory />
      </v-col>
    </v-row>
  </v-container>
</template>
