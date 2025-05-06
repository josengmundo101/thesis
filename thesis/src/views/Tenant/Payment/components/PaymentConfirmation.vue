<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue'
import { supabase } from '@/utils/supabase'
import { useUtilityStore } from '@/stores/useUtilityStore'
import { useToast } from 'vue-toastification'

const props = defineProps({
  userId: {
    type: String,
    default: null,
  },
  invoiceId: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['confirm-payment', 'close'])

const store = useUtilityStore()
const toast = useToast()
const userContact = ref('Loading...')
const gcashNumber = ref('Loading...')
const paymentAmount = ref('')
const paymentMethodType = ref('gcash')
const isConfirmed = ref(false)
const isSubmitting = ref(false)
const invoiceData = ref({
  total_amount: 0,
  outstanding_balance: 0,
  arrears: 0,
})

onMounted(async () => {
  try {
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('gcash_number')
      .single()
    if (settingsError) throw settingsError
    gcashNumber.value = settingsData?.gcash_number || 'Not available'

    const userId = props.userId || (await supabase.auth.getUser()).data.user?.id
    if (userId) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('contact_number')
        .eq('user_id', userId)
        .single()
      if (userError) throw userError
      userContact.value = userData?.contact_number || 'Not available'
    } else {
      userContact.value = 'Not available'
    }

    const data = await store.fetchInvoiceData(props.invoiceId)
    if (data) {
      invoiceData.value = data
    } else {
      toast.error('Failed to load invoice details.')
    }
  } catch (error) {
    console.error('Error fetching data:', error.message)
    userContact.value = 'Error loading contact'
    gcashNumber.value = 'Error loading Gcash number'
    toast.error('Error loading data.')
  }
})

const confirmPayment = async () => {
  isSubmitting.value = true
  try {
    const amount = Number(paymentAmount.value)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount.')
      return
    }

    isConfirmed.value = true
    emit('confirm-payment', { amount, paymentMethodType: paymentMethodType.value })
  } catch (error) {
    toast.error('Failed to initiate payment.')
  } finally {
    isSubmitting.value = false
  }
}

const closeDialog = () => {
  emit('close')
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

      <v-row class="my-2">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded-lg bg-grey-lighten-4">
            <v-row>
              <v-col cols="12" sm="4">
                <div class="text-caption text-grey-darken-1">Total Amount Due</div>
                <div class="text-h6 font-weight-medium">
                  ₱{{
                    invoiceData.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  }}
                </div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-grey-darken-1">Outstanding Balance</div>
                <div class="text-h6 font-weight-medium text-error">
                  ₱{{
                    invoiceData.outstanding_balance.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                    })
                  }}
                </div>
              </v-col>
              <v-col cols="12" sm="4">
                <div class="text-caption text-grey-darken-1">Arrears</div>
                <div class="text-h6 font-weight-medium text-error">
                  ₱{{ invoiceData.arrears.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
                </div>
              </v-col>
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="my-2" v-if="!isConfirmed">
        <v-col cols="12">
          <v-text-field
            v-model="paymentAmount"
            label="Payment Amount (₱)"
            type="number"
            min="0"
            step="0.01"
            prepend-icon="mdi-currency-php"
            :disabled="isSubmitting"
            required
          ></v-text-field>
          <v-select
            v-model="paymentMethodType"
            label="Payment Method"
            :items="[
              { title: 'GCash', value: 'gcash' },
              { title: 'PayMaya', value: 'paymaya' },
            ]"
            prepend-icon="mdi-credit-card"
            :disabled="isSubmitting"
          ></v-select>
          <v-alert
            v-if="paymentAmount && Number(paymentAmount) < invoiceData.outstanding_balance"
            type="warning"
            density="compact"
            class="mt-2"
          >
            Partial payment may result in arrears if not fully paid by due date.
          </v-alert>
        </v-col>
      </v-row>

      <v-row v-if="isConfirmed" class="my-2">
        <v-col cols="12">
          <v-sheet class="pa-3 rounded-lg bg-success-lighten-5 text-center">
            <div class="text-caption text-grey-darken-1">Payment Amount</div>
            <div class="text-h5 font-weight-bold text-success">
              ₱{{ Number(paymentAmount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) }}
            </div>
          </v-sheet>
        </v-col>
      </v-row>

      <v-row class="my-2">
        <v-col cols="12" class="text-center">
          <v-chip
            :color="isConfirmed ? 'success' : 'warning'"
            variant="tonal"
            size="large"
            :prepend-icon="isConfirmed ? 'mdi-check-circle' : 'mdi-clock-outline'"
          >
            {{ isConfirmed ? 'Payment Initiated' : 'Awaiting Confirmation' }}
          </v-chip>
        </v-col>
      </v-row>

      <v-row v-if="!isConfirmed" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-btn
            color="success"
            prepend-icon="mdi-check"
            variant="elevated"
            @click="confirmPayment"
            :disabled="isSubmitting || !paymentAmount"
            :loading="isSubmitting"
          >
            Confirm Payment
          </v-btn>
          <v-btn
            color="grey"
            variant="text"
            class="ml-2"
            @click="closeDialog"
            :disabled="isSubmitting"
          >
            Cancel
          </v-btn>
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
