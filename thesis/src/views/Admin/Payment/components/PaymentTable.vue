<script setup>
import { ref } from 'vue'
import { defineEmits, defineProps } from 'vue'

const props = defineProps({
  payments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['status-change'])

// Dialog Handling
const dialog = ref(false)
const selectedPayment = ref(null)

// Open Confirm Dialog
const openDialog = (payment, action) => {
  selectedPayment.value = { ...payment, action }
  dialog.value = true
}

// Emit Status Change Event
const changeStatus = () => {
  if (selectedPayment.value) {
    emit('status-change', selectedPayment.value.id, selectedPayment.value.action)
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
          <td>{{ item.status }}</td>
          <td>
            <v-btn
              color="success"
              class="mr-2"
              @click="openDialog(item, 'approved')"
              :disabled="item.status.toLowerCase() === 'approved'"
            >
              Approve
            </v-btn>
            <v-btn
              color="error"
              @click="openDialog(item, 'rejected')"
              :disabled="item.status.toLowerCase() === 'rejected'"
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
