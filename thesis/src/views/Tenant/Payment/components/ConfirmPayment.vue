<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import PaymentConfirmation from './PaymentConfirmation.vue'

const props = defineProps({
  grandTotal: { type: Number, required: true },
  currentTotal: { type: Number, required: true },
})

const emit = defineEmits(['confirm-payment'])

const showConfirmationDialog = ref(false)
const selectedPaymentMethod = ref('gcash')

const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const handlePayment = () => {
  showConfirmationDialog.value = true
}

const finalizePayment = () => {
  showConfirmationDialog.value = false
  emit('confirm-payment', selectedPaymentMethod.value)
}

const handleClose = () => {
  showConfirmationDialog.value = false
}

console.log('Grand Total:', props.grandTotal)
console.log('Current Total:', props.currentTotal)
</script>

<template>
  <v-card elevation="1" class="pa-4 text-center hover-scale fade-in delay-150">
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Grand Total: ₱{{ grandTotal.toLocaleString() }}
    </v-card-text>

    <v-select
      v-model="selectedPaymentMethod"
      :items="[
        { title: 'GCash', value: 'gcash' },
        { title: 'PayMaya', value: 'paymaya' },
        { title: 'Card', value: 'card' },
      ]"
      label="Select Payment Method"
      class="mb-4"
    ></v-select>

    <v-btn block color="primary" class="py-3" @click="handlePayment">
      Pay with {{ capitalize(selectedPaymentMethod) }}
    </v-btn>

    <v-dialog v-model="showConfirmationDialog" max-width="600px" persistent>
      <payment-confirmation
        :payment-amount="grandTotal"
        :payment-method="selectedPaymentMethod"
        @confirm="finalizePayment"
        @close="handleClose"
      />
    </v-dialog>
  </v-card>
</template>
