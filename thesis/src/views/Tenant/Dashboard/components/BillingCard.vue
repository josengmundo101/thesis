<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  tenant: {
    type: Object,
    required: false, // Changed to optional to handle fallback
  },
})

const store = useUtilityStore()
const isLoading = ref(false)
const toast = useToast()
const authUserId = ref(null)

onMounted(async () => {
  isLoading.value = true
  console.log('🔍 Tenant prop:', props.tenant)
  try {
    // Fetch authenticated user's ID as fallback
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('⚠️ No authenticated user found')
      toast.error('Please log in to view billing details.')
      return
    }
    authUserId.value = user.id
    console.log('🔍 Authenticated user_id:', authUserId.value)

    // Fetch settings
    await store.fetchSettings()

    // Use tenant.user_id if available, else fallback to authUserId
    const userId = props.tenant?.user_id || authUserId.value
    if (userId) {
      console.log('🔍 Fetching tenant rates for user_id:', userId)
      await store.fetchTenantRates(userId)
    } else {
      console.warn('⚠️ No tenant user_id provided and no auth user_id available')
      toast.error('Unable to load billing details: No tenant ID provided.')
    }
  } catch (error) {
    console.error('⚠️ Error in BillingCard onMounted:', error.message)
    toast.error('Failed to load billing details: ' + error.message)
  } finally {
    isLoading.value = false
    if (store.errorMessage) {
      toast.error(store.errorMessage)
    }
  }
})
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100" :disabled="isLoading">
    <v-card-title class="text-h6 font-weight-bold">Billing Details</v-card-title>
    <v-divider></v-divider>
    <v-progress-linear
      v-if="isLoading"
      indeterminate
      color="primary"
      class="mb-4"
    ></v-progress-linear>
    <v-list density="compact" v-else>
      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="deep-orange">mdi-home-city</v-icon>
        </template>
        <v-list-item-title>Rent</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold text-primary">
          ₱{{ store.effectiveRates.rent }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="amber">mdi-lightning-bolt</v-icon>
        </template>
        <v-list-item-title>Electricity</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold text-primary">
          ₱{{ store.effectiveRates.electricity }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="blue">mdi-water</v-icon>
        </template>
        <v-list-item-title>Water</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold text-primary">
          ₱{{ store.effectiveRates.water }}
        </v-list-item-subtitle>
      </v-list-item>

      <v-list-item>
        <template v-slot:prepend>
          <v-icon color="green">mdi-wifi</v-icon>
        </template>
        <v-list-item-title>Internet</v-list-item-title>
        <v-list-item-subtitle class="font-weight-bold text-primary">
          ₱{{ store.effectiveRates.wifi }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
    <v-divider></v-divider>
    <v-card-text class="text-h6 font-weight-bold"> Total: ₱{{ store.total }} </v-card-text>
  </v-card>
</template>
