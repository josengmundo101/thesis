<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import {
  VDialog,
  VCard,
  VCardTitle,
  VCardText,
  VCardActions,
  VIcon,
  VBtn,
  VChip,
} from 'vuetify/components'

// Props and emits
const props = defineProps({
  modelValue: Boolean, // Dialog visibility control
  tenant: Object, // Tenant details
})

const emit = defineEmits(['update:modelValue'])

// Computed property to handle `v-model` without mutating props
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Function to close modal
const closeModal = () => {
  dialogVisible.value = false
}

// Computed for room assignment details
const roomAssignment = computed(() => {
  const assignment = props.tenant?.bed_assignment?.[0] // Get the first assignment
  if (!assignment) return 'Not assigned'

  const roomNumber = assignment?.rooms?.room_number || 'N/A'
  const bedSide = assignment?.bed_side || 'N/A'
  return `Room ${roomNumber} — ${bedSide.charAt(0).toUpperCase() + bedSide.slice(1)}`
})
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="450">
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Tenant Details</span>
        <v-btn icon @click="closeModal">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Tenant Info -->
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <div class="ml-4">
            <h3 class="text-h6 font-weight-medium">{{ tenant.firstname }} {{ tenant.lastname }}</h3>
            <p class="text-caption text-grey-darken-1">Tenant ID: {{ tenant.custom_id }}</p>
          </div>
        </div>

        <!-- Details List -->
        <v-list density="compact">
          <v-list-item>
            <template #prepend><v-icon color="primary">mdi-email</v-icon></template>
            <v-list-item-title>Email</v-list-item-title>
            <v-list-item-subtitle>{{ tenant.email }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend><v-icon color="primary">mdi-phone</v-icon></template>
            <v-list-item-title>Contact</v-list-item-title>
            <v-list-item-subtitle>{{
              tenant.contact_number || 'Not provided'
            }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend><v-icon color="primary">mdi-map-marker</v-icon></template>
            <v-list-item-title>Address</v-list-item-title>
            <v-list-item-subtitle>{{ tenant.address || 'Not provided' }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend><v-icon color="primary">mdi-home</v-icon></template>
            <v-list-item-title>Room Assignment</v-list-item-title>
            <v-list-item-subtitle>{{ roomAssignment }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend><v-icon color="primary">mdi-credit-card</v-icon></template>
            <v-list-item-title>Payment Status</v-list-item-title>
            <v-chip :color="tenant.status === 'Paid' ? 'green' : 'orange'" small>{{
              tenant.status
            }}</v-chip>
          </v-list-item>
        </v-list>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="closeModal">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #e3f2fd;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
