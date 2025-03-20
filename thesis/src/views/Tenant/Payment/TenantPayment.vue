<script setup>
import { ref } from 'vue'
import BillingSummary from './components/BillingSummary.vue'
import ConfirmPayment from './components/ConfirmPayment.vue'

const totalAmount = ref(5000) // Replace with computed value from BillingSummary

// Placeholder function (uncomment when integrating backend)
// const handleConfirmPayment = async () => {
//   try {
//     const response = await fetch('https://your-backend.com/create-paymongo-checkout', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ amount: totalAmount.value }),
//     })

//     const data = await response.json()

//     if (data.checkout_url) {
//       window.location.href = data.checkout_url // Redirect to PayMongo
//     } else {
//       alert('Error creating payment session')
//     }
//   } catch (error) {
//     console.error('Payment Error:', error)
//   }
// }
</script>

<template>
  <v-container class="py-10">
    <!-- Page Header -->
    <v-row justify="center">
      <v-col cols="12" md="8" class="text-center hover-scale fade-in delay-100">
        <h2 class="text-h4 font-weight-bold text-white mb-2">Make a Payment</h2>
        <p class="text-body-1 text-grey-lighten-1">
          Review your bill and proceed to secure payment via PayMongo.
        </p>
      </v-col>
    </v-row>

    <!-- Payment Details -->
    <v-row justify="center" class="mt-6">
      <v-col cols="12" md="6">
        <BillingSummary />
      </v-col>
    </v-row>

    <!-- Confirm Payment Button -->
    <v-row justify="center" class="mt-4">
      <v-col cols="12" md="6">
        <ConfirmPayment :totalAmount="totalAmount" @confirm="handleConfirmPayment" />
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Elegant Styling */
.text-h4 {
  font-size: 2rem;
}

.v-card {
  border-radius: 12px;
  transition: box-shadow 0.3s ease-in-out;
}

.v-card:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
</style>
