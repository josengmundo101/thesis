<script setup>
// ✅ Define props for total values
import { defineProps, defineEmits } from 'vue'

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

// ✅ Define emit for the payment confirmation event
const emit = defineEmits(['confirm-payment'])

// Call emit when a payment is confirmed
const handlePayment = () => {
  // ... your payment logic here
  emit('confirm-payment')
}

// ✅ Usage inside logic (to prevent linter errors)
console.log('Grand Total:', props.grandTotal)
console.log('Current Total:', props.currentTotal)
</script>

<template>
  <v-card elevation="1" class="pa-4 text-center hover-scale fade-in delay-150">
    <!-- ✅ Display grand total from props -->
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Grand Total: ₱{{ grandTotal.toLocaleString() }}
    </v-card-text>
    <!-- ✅ Emit payment confirmation on button click -->
    <v-btn block color="primary" class="py-3" @click="handlePayment"> Pay with PayMongo </v-btn>
  </v-card>
</template>
