<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { supabase } from '@/utils/supabase' // Ensure this import is present
import { useToast } from 'vue-toastification' // Add this import

const props = defineProps({
  payments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['status-change'])

// Initialize toast
const toast = useToast()

// Dialog Handling
const dialog = ref(false)
const selectedPayment = ref(null)

// Open Confirm Dialog
const openDialog = (payment, action) => {
  selectedPayment.value = { ...payment, action }
  dialog.value = true
}

// Emit Status Change Event with Notification
const changeStatus = async () => {
  // Make it async to handle Supabase calls
  if (selectedPayment.value) {
    // Update the status in the local payments array immediately
    const paymentIndex = props.payments.findIndex((p) => p.id === selectedPayment.value.id)
    if (paymentIndex !== -1) {
      props.payments[paymentIndex].status = selectedPayment.value.action // Update status locally
    }

    try {
      // Insert notification into Supabase
      const { error: notificationError } = await supabase.from('notifications').insert({
        message: `Your payment of $${selectedPayment.value.amount} has been ${selectedPayment.value.action}.`,
        type: selectedPayment.value.action === 'approved' ? 'success' : 'error',
        tenant_identifier: selectedPayment.value.user_id || selectedPayment.value.tenant_id, // Adjust based on your schema
        status: 'unread',
        timestamp: new Date().toISOString(),
      })

      if (notificationError) throw notificationError

      // Emit the event to update the database
      emit('status-change', {
        payment_id: selectedPayment.value.id,
        invoice_id: selectedPayment.value.invoice_id,
        amount: selectedPayment.value.amount,
        action: selectedPayment.value.action,
      })

      // Show success toast
      toast.success(
        `Payment of $${selectedPayment.value.amount} ${selectedPayment.value.action} successfully!`,
      )
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error(`Failed to ${selectedPayment.value.action} payment. Please try again.`)
    }

    dialog.value = false
  }
}
</script>

<template>
  <v-card>
    <v-data-table
      :headers="[
        { text: 'Name', value: 'name' },
        { text: 'Amount', value: 'amount' },
        { text: 'Date', value: 'date' },
        { text: 'Status', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false },
      ]"
      :items="payments"
      class="elevation-1"
    >
      <template #body="{ items }">
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.name }}</td>
          <td>{{ item.amount }}</td>
          <td>{{ item.date }}</td>
          <td>
            <v-chip
              :color="
                item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'grey'
              "
              dark
            >
              {{ item.status }}
            </v-chip>
          </td>
          <td>
            <v-btn
              v-if="item.status === 'pending'"
              color="success"
              class="mr-2"
              @click="openDialog(item, 'approved')"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="item.status !== 'approved' && item.status !== 'rejected'"
              color="error"
              @click="openDialog(item, 'rejected')"
            >
              Reject
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>

  <!-- Confirmation Dialog -->
  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Change Payment Status</v-card-title>
      <v-card-text>
        Are you sure you want to
        <strong>{{ selectedPayment.value?.action }}</strong>
        this payment?
      </v-card-text>
      <v-card-actions>
        <v-btn text color="grey" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="changeStatus">Confirm</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
