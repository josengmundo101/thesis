<script setup>
// import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  payments: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update-status'])

const updateStatus = (id, status) => {
  emit('update-status', id, status)
}
</script>

<template>
  <v-card elevation="2">
    <v-table>
      <thead>
        <tr>
          <th class="text-left">Name</th>
          <th class="text-left">Payment</th>
          <th class="text-left">Time</th>
          <th class="text-left">Date</th>
          <th class="text-left">Action</th>
        </tr>

        <tr v-for="payment in props.payments" :key="payment.id"></tr>
      </thead>
      <tbody>
        <tr v-for="payment in payments" :key="payment.id">
          <td>{{ payment.name }}</td>
          <td>{{ payment.amount }}</td>
          <td>{{ payment.time }}</td>
          <td>{{ payment.date }}</td>
          <td>
            <v-btn
              v-if="payment.status === 'Pending'"
              color="green"
              size="small"
              @click="updateStatus(payment.id, 'Approved')"
            >
              Approve
            </v-btn>
            <v-btn
              v-if="payment.status === 'Pending'"
              color="red"
              size="small"
              class="ml-2"
              @click="updateStatus(payment.id, 'Rejected')"
            >
              Reject
            </v-btn>
            <v-chip
              v-if="payment.status !== 'Pending'"
              :color="payment.status === 'Approved' ? 'green' : 'red'"
              small
            >
              {{ payment.status }}
            </v-chip>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<style scoped>
.v-chip {
  font-size: 12px;
  font-weight: 500;
}
</style>
