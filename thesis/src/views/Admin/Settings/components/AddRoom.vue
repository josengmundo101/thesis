<script setup>
import { ref } from 'vue'
import { supabase } from '@/utils/supabase'

// Reactive form fields
const roomNumber = ref('')
const capacity = ref(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Function to add room
const addRoom = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!roomNumber.value || !capacity.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }

  try {
    loading.value = true

    // Insert into Supabase
    const { data, error } = await supabase.from('rooms').insert([
      {
        room_number: roomNumber.value,
        capacity: capacity.value,
      },
    ])

    if (error) throw error
    successMessage.value = `Room ${roomNumber.value} added successfully!`

    // Clear form fields
    roomNumber.value = ''
    capacity.value = null
  } catch (error) {
    errorMessage.value = error.message || 'Failed to add room. Try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-card class="pa-5" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">Add New Room</v-card-title>
    <v-divider></v-divider>

    <v-card-text>
      <v-text-field label="Room Number" v-model="roomNumber" type="text" outlined dense required />

      <v-text-field
        label="Capacity"
        v-model="capacity"
        type="number"
        outlined
        dense
        required
        min="1"
      />

      <v-alert v-if="errorMessage" type="error" dense class="mt-2">
        {{ errorMessage }}
      </v-alert>

      <v-alert v-if="successMessage" type="success" dense class="mt-2">
        {{ successMessage }}
      </v-alert>
    </v-card-text>

    <v-card-actions>
      <v-btn :loading="loading" color="primary" @click="addRoom">Add Room</v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.v-card {
  border-radius: 16px;
  max-width: 400px;
  margin: 0 auto;
}
</style>
