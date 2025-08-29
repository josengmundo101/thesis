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
const loading = ref(false)
const highlightedRow = ref(null)

const openDialog = (payment, action) => {
  selectedPayment.value = { ...payment, action }
  dialog.value = true
}

const changeStatus = async () => {
  if (selectedPayment.value) {
    loading.value = true
    try {
      const actionType = selectedPayment.value.action

      // Update the status in the Supabase payment table
      const { error: updateError } = await supabase
        .from('payment')
        .update({ status: actionType })
        .eq('payment_id', selectedPayment.value.id)

      if (updateError) throw updateError

      // Check if user_id exists and log for debugging
      console.log('Selected Payment:', selectedPayment.value)
      if (!selectedPayment.value.user_id) {
        throw new Error('User ID is missing for this payment')
      }

      // Generate a more pleasing notification message
      const formattedDate = selectedPayment.value.date
      const paymentMethod = selectedPayment.value.method
      let message = ''
      if (actionType === 'approved') {
        message = `Great news, ${selectedPayment.value.name}! Your payment of ₱${selectedPayment.value.amount} via ${paymentMethod} on ${formattedDate} has been successfully approved by the admin. Thank you for your prompt payment!`
      } else if (actionType === 'rejected') {
        message = `Hello ${selectedPayment.value.name}, we’re sorry to inform you that your payment of ₱${selectedPayment.value.amount} via ${paymentMethod} on ${formattedDate} was rejected by the admin. Please contact support for more details.`
      }

      // Send notification using only user_id
      console.log('Sending Notification with user_id:', selectedPayment.value.user_id)
      const { error: notificationError } = await supabase.from('notifications').insert({
        message,
        type: actionType === 'approved' ? 'success' : 'error',
        user_id: selectedPayment.value.user_id,
        status: 'unread',
        timestamp: new Date().toISOString(),
      })

      if (notificationError) {
        console.error('Error sending notification:', notificationError)
      }

      // Emit the correct event with the payment object
      emit('status-change', {
        payment_id: selectedPayment.value.id,
        invoice_id: selectedPayment.value.invoice_id,
        amount: selectedPayment.value.amount,
        action: actionType,
      })

      // Highlight the updated row
      highlightedRow.value = selectedPayment.value.id
      setTimeout(() => {
        highlightedRow.value = null
      }, 3000)

      // Enhanced toast message with user name
      toast.success(
        `Payment of ₱${selectedPayment.value.amount} for ${selectedPayment.value.name} ${actionType} successfully!`,
        {
          icon: 'mdi-check-circle',
          timeout: 3000,
        },
      )
    } catch (error) {
      console.error('Error updating payment status:', error)
      toast.error(`Failed to ${selectedPayment.value.action} payment. Please try again.`, {
        timeout: 3000,
      })
    } finally {
      loading.value = false
      dialog.value = false
    }
  }
}
</script>

<template>
  <v-card elevation="2" class="pa-3" style="border-radius: 8px">
    <v-data-table
      :headers="[
        { text: 'Name', value: 'name' },
        { text: 'Amount', value: 'amount' },
        { text: 'Date', value: 'date' },
        { text: 'Status', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false },
      ]"
      :items="payments"
      class="elevation-0"
    >
      <template #body="{ items }">
        <tr
          v-for="item in items"
          :key="item.id"
          :class="{
            'highlighted-row': highlightedRow === item.id,
            'incomplete-row': !item.custom_id,
          }"
        >
          <td>
            {{ item.name }}
            <v-tooltip v-if="!item.custom_id" top>
              <template v-slot:activator="{ on, attrs }">
                <v-icon small color="orange" class="ml-1" v-bind="attrs" v-on="on">
                  mdi-alert
                </v-icon>
              </template>
              <span>User data incomplete: Custom ID missing</span>
            </v-tooltip>
          </td>
          <td>{{ item.amount }}</td>
          <td>{{ item.date }}</td>
          <td>
            <v-chip
              :color="
                item.status === 'approved' ? 'green' : item.status === 'rejected' ? 'red' : 'grey'
              "
              dark
              small
            >
              {{ item.status }}
            </v-chip>
          </td>
          <td>
            <v-btn
              v-if="item.status === 'pending'"
              color="success"
              class="mr-2"
              small
              @click="openDialog(item, 'approved')"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="item.status !== 'approved' && item.status !== 'rejected'"
              color="error"
              small
              @click="openDialog(item, 'rejected')"
            >
              Reject
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>

  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Change Payment Status</v-card-title>
      <v-card-text>
        Are you sure you want to
        <strong>{{ selectedPayment.value?.action }}</strong>
        this payment of ₱{{ selectedPayment.value?.amount }}?
      </v-card-text>
      <v-card-actions>
        <v-btn text color="grey" @click="dialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="changeStatus" :loading="loading" :disabled="loading">
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-data-table {
  border-radius: 6px;
  overflow: hidden;
}

.v-data-table tr {
  transition: background-color 0.3s ease;
}

.v-data-table tr:hover {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
}

.highlighted-row {
  background-color: rgba(var(--v-theme-success), 0.1);
  transition: background-color 0.5s ease-out;
}

.incomplete-row {
  background-color: rgba(255, 165, 0, 0.1);
}

.v-btn {
  text-transform: none;
  font-weight: 500;
}
</style>
