<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'

// Props and emits
const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  tenant: Object, // Tenant details
})

const emit = defineEmits(['update:modelValue', 'roomAssigned'])

// Available rooms list
const AVAILABLE_ROOMS = [
  '101 - Garden View',
  '102 - Garden View',
  '201 - Pool View',
  '202 - Pool View',
  '301 - Ocean View',
  '302 - Ocean View',
]

const selectedRoom = ref(null)

// Computed for dialog visibility
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Function to assign room
const handleAssign = () => {
  if (selectedRoom.value) {
    emit('roomAssigned', { ...props.tenant, room: selectedRoom.value })
    dialogVisible.value = false // Close modal
  }
}

// Close modal function
const closeModal = () => {
  selectedRoom.value = null
  dialogVisible.value = false
}

// Computed property for tenant's current room
const tenantRoom = computed(() => props.tenant?.room || 'No room currently assigned')
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="450">
    <v-card>
      <!-- Header -->
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Assign Room</span>
        <v-btn icon @click="closeModal">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Tenant Info -->
      <v-card-text>
        <h3 class="text-subtitle-1 font-weight-medium">Current Assignment</h3>
        <p class="text-body-2 text-grey-darken-1 mb-4">{{ tenantRoom }}</p>

        <h3 class="text-subtitle-1 font-weight-medium mb-2">Select a New Room</h3>
        <v-list dense>
          <v-list-item
            v-for="room in AVAILABLE_ROOMS"
            :key="room"
            @click="selectedRoom = room"
            :class="{ 'selected-room': selectedRoom === room }"
          >
            <template #prepend>
              <v-icon v-if="selectedRoom === room" color="primary">mdi-check-circle</v-icon>
            </template>
            <v-list-item-title>{{ room }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="closeModal">Cancel</v-btn>
        <v-btn color="primary" :disabled="!selectedRoom" @click="handleAssign"> Assign Room </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.selected-room {
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
}
</style>
