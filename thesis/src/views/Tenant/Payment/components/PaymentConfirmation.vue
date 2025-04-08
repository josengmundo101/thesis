<!-- PaymentConfirmation.vue -->
<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { supabase } from '@/utils/supabase' // Adjust path to your Supabase client

// Define props
const props = defineProps({
  paymentAmount: {
    type: Number,
    required: true,
  },
  userId: {
    // Optional prop for user identification
    type: String,
    default: null,
  },
})

// Define emit for confirmation
const emit = defineEmits(['confirm'])

// Reactive data
const userContact = ref('Loading...')
const gcashNumber = ref('Loading...')
const isConfirmed = ref(false)

// Fetch data from Supabase on mount
onMounted(async () => {
  try {
    // Fetch Gcash number from settings table
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('gcash_number')
      .single() // Assumes one row; adjust if multiple rows exist

    if (settingsError) throw settingsError
    gcashNumber.value = settingsData?.gcash_number || 'Not available'

    // Fetch user contact number from users table
    // Assuming userId is provided; adjust logic if user is authenticated differently
    if (props.userId) {
      // use provided userId
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('contact_number')
        .eq('user_id', props.userId)
        .single()
      if (userError) throw userError
      userContact.value = userData?.contact_number || 'Not available'
    } else {
      // fallback to authenticated user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()
      if (error) throw error

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('contact_number')
        .eq('user_id', user.id)
        .single()
      if (userError) throw userError
      userContact.value = userData?.contact_number || 'Not available'
    }
  } catch (error) {
    console.error('Error fetching data from Supabase:', error.message)
    userContact.value = 'Error loading contact'
    gcashNumber.value = 'Error loading Gcash number'
  }
})

// Confirm payment action
const confirmPayment = () => {
  isConfirmed.value = true
  emit('confirm') // Emit to parent to finalize payment
}
</script>

<template>
  <v-card class="payment-confirmation-card" rounded="lg" elevation="2">
    <v-card-title class="text-h6 font-weight-bold d-flex align-center">
      <v-icon color="success" class="mr-2">mdi-cash-check</v-icon>
      Payment Confirmation
    </v-card-title>

    <v-divider class="mx-4"></v-divider>

    <v-card-text>
      <!-- Contact Information -->
      <v-row class="my-2">
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded-lg bg-grey-lighten-4">
            <div class="text-caption text-grey-darken-1">Tenant Contact Number</div>
            <div class="text-h6 font-weight-medium">
              <v-icon small class="mr-1" color="primary">mdi-phone</v-icon>
              {{ userContact }}
            </div>
          </v-sheet>
        </v-col>
        <v-col cols="12" sm="6">
          <v-sheet class="pa-3 rounded-lg bg-grey-lighten-4">
            <div class="text-caption text-grey-darken-1">Gcash Number</div>
            <div class="text-h6 font-weight-medium">
              <v-icon small class="mr-1" color="primary">mdi-wallet</v-icon>
              {{ gcashNumber }}
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- Payment Details -->
      <v-row class="my-2">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded-lg bg-success-lighten-5 text-center">
            <div class="text-caption text-grey-darken-1">Payment Amount</div>
            <div class="text-h5 font-weight-bold text-success">
              ₱{{ paymentAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <!-- Confirmation Status -->
      <v-row class="my-2">
        <v-col cols="12" class="text-center">
          <v-chip
            :color="isConfirmed ? 'success' : 'warning'"
            variant="tonal"
            size="large"
            :prepend-icon="isConfirmed ? 'mdi-check-circle' : 'mdi-clock-outline'"
          >
            {{ isConfirmed ? 'Payment Confirmed' : 'Awaiting Confirmation' }}
          </v-chip>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row v-if="!isConfirmed" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-btn
            color="success"
            prepend-icon="mdi-check"
            variant="elevated"
            @click="confirmPayment"
          >
            Confirm Payment
          </v-btn>
          <v-btn color="grey" variant="text" class="ml-2" @click="$emit('close')"> Cancel </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.payment-confirmation-card {
  max-width: 600px;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.payment-confirmation-card:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.text-success {
  color: #2e7d32;
}
</style>
