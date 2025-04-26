<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'

const props = defineProps({
  payments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['status-change'])
const toast = useToast()

const dialog = ref(false)
const selectedPayment = ref(null)

// Open Confirm Dialog
const openDialog = (payment, action) => {
  selectedPayment.value = { ...payment, action }
  dialog.value = true
}

// Change Status Function
const changeStatus = async () => {
  if (selectedPayment.value) {
    const paymentIndex = props.payments.findIndex((p) => p.id === selectedPayment.value.id)

    if (paymentIndex !== -1) {
      const updatedPayments = [...props.payments]
      updatedPayments[paymentIndex].status = selectedPayment.value.action
      emit('status-change', updatedPayments)
    }

    try {
      const actionType = selectedPayment.value.action
      const message = `Your payment of ₱${selectedPayment.value.amount} has been ${actionType} by the admin.`

      const { error: notificationError } = await supabase.from('notifications').insert({
        message,
        type: actionType === 'approved' ? 'success' : 'error',
        tenant_identifier: selectedPayment.value.user_id, // ✅ Using Supabase Auth user_id
        status: 'unread',
        timestamp: new Date().toISOString(),
      })

      if (notificationError) throw notificationError

      emit('status-change', {
        payment_id: selectedPayment.value.id,
        invoice_id: selectedPayment.value.invoice_id,
        amount: selectedPayment.value.amount,
        action: actionType,
      })

      toast.success(`Payment of ₱${selectedPayment.value.amount} ${actionType} successfully!`)
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
