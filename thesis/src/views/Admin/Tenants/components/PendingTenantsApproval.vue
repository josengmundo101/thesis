<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'

const pendingTenants = ref([])
const loading = ref(false)
const error = ref('')

// Fetch pending tenants
const fetchPendingTenants = async () => {
  loading.value = true
  error.value = ''
  try {
    const { data, error: fetchError } = await supabase
      .from('users')
      .select('user_id, firstname, lastname, email, contact_number, created_at')
      .eq('role', 'tenant')
      .eq('status', 'pending') // Adjust based on your schema
      .order('created_at', { ascending: true })

    if (fetchError) throw fetchError
    pendingTenants.value = data
  } catch (err) {
    error.value = err.message || 'Failed to load pending tenants.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPendingTenants()
})

// Approve or reject tenant
const updateTenantStatus = async (userId, status) => {
  try {
    const { error: updateError } = await supabase
      .from('users')
      .update({ status })
      .eq('user_id', userId)

    if (updateError) throw updateError
    // Remove user from local list after action
    pendingTenants.value = pendingTenants.value.filter((t) => t.user_id !== userId)
  } catch (err) {
    console.error('Status update error:', err.message)
  }
}
</script>

<template>
  <v-card class="pa-5" elevation="2">
    <v-card-title class="text-h6 font-weight-bold"> Pending Tenant Approvals </v-card-title>
    <v-divider></v-divider>

    <v-card-text>
      <v-alert type="error" v-if="error" class="mb-4">{{ error }}</v-alert>

      <v-progress-circular indeterminate color="primary" v-if="loading" class="my-5" />

      <v-table v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Contact</th>
            <th>Registered On</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tenant in pendingTenants" :key="tenant.user_id">
            <td>{{ tenant.firstname }} {{ tenant.lastname }}</td>
            <td>{{ tenant.email }}</td>
            <td>{{ tenant.contact_number }}</td>
            <td>
              {{
                new Date(tenant.created_at).toLocaleString('en-PH', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              }}
            </td>
            <td>
              <v-btn color="success" icon @click="updateTenantStatus(tenant.user_id, 'approved')">
                <v-icon>mdi-check</v-icon>
              </v-btn>
              <v-btn color="red" icon @click="updateTenantStatus(tenant.user_id, 'rejected')">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </td>
          </tr>
          <tr v-if="pendingTenants.length === 0">
            <td colspan="5" class="text-center">No pending tenants found.</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>

<style scoped>
td {
  vertical-align: middle;
}
</style>
