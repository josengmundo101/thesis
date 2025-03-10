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

// Computed initials for avatar
const tenantInitials = computed(() =>
  props.tenant?.name
    ? props.tenant.name
        .split(' ')
        .map((n) => n[0])
        .join('')
    : '',
)
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
          <div class="avatar">
            <span class="text-h5 font-weight-medium text-primary">{{ tenantInitials }}</span>
          </div>
          <div class="ml-4">
            <h3 class="text-h6 font-weight-medium">{{ tenant.name }}</h3>
            <p class="text-caption text-grey-darken-1">Tenant ID: {{ tenant.id }}</p>
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
              tenant.contactNumber || 'Not provided'
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
            <v-list-item-subtitle>{{ tenant.room || 'Not assigned' }}</v-list-item-subtitle>
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
