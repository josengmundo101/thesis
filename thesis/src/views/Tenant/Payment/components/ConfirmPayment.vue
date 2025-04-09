<script setup>
import { defineProps, defineEmits, ref } from 'vue'
import PaymentConfirmation from './PaymentConfirmation.vue' // Adjust path as needed

// Define props for total values
const props = defineProps({
  grandTotal: {
    type: Number,
    required: true,
  },
  currentTotal: {
    type: Number,
    required: true,
  },
})

// Define emit for the payment confirmation event
const emit = defineEmits(['confirm-payment'])

// State to control dialog visibility
const showConfirmationDialog = ref(false)

// Handle payment initiation
const handlePayment = () => {
  showConfirmationDialog.value = true // Show the confirmation dialog
}

// Handle final payment confirmation from the dialog
const finalizePayment = () => {
  showConfirmationDialog.value = false // Close the dialog
  emit('confirm-payment') // Emit to parent after confirmation
}

// Add handler for close event
const handleClose = () => {
  showConfirmationDialog.value = false
}

// Debug logs
console.log('Grand Total:', props.grandTotal)
console.log('Current Total:', props.currentTotal)
</script>

<template>
  <v-card elevation="1" class="pa-4 text-center hover-scale fade-in delay-150">
    <!-- Display grand total from props -->
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Grand Total: ₱{{ grandTotal.toLocaleString() }}
    </v-card-text>
    <!-- Trigger payment process -->
    <v-btn block color="primary" class="py-3" @click="handlePayment"> Pay with Gcash </v-btn>

    <!-- Payment Confirmation Dialog -->
    <v-dialog v-model="showConfirmationDialog" max-width="600px" persistent>
      <payment-confirmation
        :payment-amount="grandTotal"
        @confirm="finalizePayment"
        @close="handleClose"
      />
    </v-dialog>
  </v-card>
</template>
