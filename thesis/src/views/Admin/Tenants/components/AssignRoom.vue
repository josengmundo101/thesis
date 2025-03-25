<script setup>
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'

// Props and Emits
const props = defineProps({
  modelValue: Boolean, // Controls dialog visibility
  tenant: Object, // Tenant details
})
const emit = defineEmits(['update:modelValue', 'roomAssigned'])
const toast = useToast()

// Reactive Variables
const selectedRoom = ref(null)
const bedSide = ref(null) // No default to force selection
const availableRooms = ref([])
const loading = ref(false)
const assigning = ref(false)
const errorMessage = ref('')

// Computed for Dialog Visibility
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// 🔍 Fetch Available Rooms from Supabase
const fetchAvailableRooms = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    // Fetch rooms with assigned tenants
    const { data, error } = await supabase.from('rooms').select(`
        room_id, 
        room_number, 
        capacity,
        bed_assignment (
          bed_side
        )
      `)

    if (error) throw error

    if (!data || data.length === 0) {
      errorMessage.value = 'No rooms available'
      return
    }

    // Check room capacity and availability
    availableRooms.value = data
      .map((room) => {
        const assignedSides = room.bed_assignment?.map((b) => b.bed_side) || []
        const remainingSides = ['bottom', 'top'].filter((side) => !assignedSides.includes(side))

        return {
          ...room,
          currentOccupancy: assignedSides.length,
          availableSides: remainingSides,
        }
      })
      .filter((room) => room.currentOccupancy < room.capacity) // 🔑 Exclude full rooms

    console.log('Available Rooms:', availableRooms.value)
  } catch (error) {
    console.error('Error fetching rooms:', error.message)
    errorMessage.value = 'Failed to load rooms. Please try again later.'
  } finally {
    loading.value = false
  }
}

// 🔄 Function to Check if Tenant Already Has a Room
const fetchExistingAssignment = async () => {
  try {
    const { data, error } = await supabase
      .from('bed_assignment')
      .select('*')
      .eq('user_id', props.tenant.user_id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    return null // No existing assignment
  }
}

// 🔑 Assign or Update Room in `bed_assignment` Table
const handleAssign = async () => {
  if (!selectedRoom.value || !bedSide.value) {
    toast.error('Please select a room and bed side.')
    return
  }

  assigning.value = true
  try {
    console.log('Assigning Room:', selectedRoom.value.room_number)
    console.log('Bed Side:', bedSide.value)
    console.log('Tenant:', props.tenant.user_id)

    // Check if the user already has an assigned room
    const existingAssignment = await fetchExistingAssignment()

    let response
    if (existingAssignment) {
      // 🏠 Update Existing Assignment
      response = await supabase
        .from('bed_assignment')
        .update({
          room_id: selectedRoom.value.room_id,
          bed_side: bedSide.value,
          date_assigned: new Date().toISOString(),
        })
        .eq('user_id', props.tenant.user_id)
    } else {
      // ➕ Insert New Assignment
      response = await supabase.from('bed_assignment').insert([
        {
          user_id: props.tenant.user_id,
          room_id: selectedRoom.value.room_id,
          bed_side: bedSide.value,
          date_assigned: new Date().toISOString(),
        },
      ])
    }

    if (response.error) throw response.error

    // Emit to parent component
    emit('roomAssigned', {
      ...props.tenant,
      room_id: selectedRoom.value.room_id,
      bed_side: bedSide.value,
    })

    toast.success(
      `Room ${selectedRoom.value.room_number} (${bedSide.value.toUpperCase()}) assigned successfully!`,
    )
    closeModal()
  } catch (error) {
    toast.error('Failed to assign room. Please try again.')
    console.error('🛑 Error assigning room:', error.message)
  } finally {
    assigning.value = false
  }
}

// Close Modal Function
const closeModal = () => {
  selectedRoom.value = null
  bedSide.value = null
  dialogVisible.value = false
}

// Fetch Rooms on Component Mount
onMounted(() => {
  fetchAvailableRooms()
})
</script>

<template>
  <v-dialog v-model="dialogVisible" max-width="450">
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h6">Assign Room</span>
        <v-btn icon @click="closeModal">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <h3 class="text-subtitle-1 font-weight-medium mb-2">Select Room</h3>

        <v-progress-circular v-if="loading" indeterminate color="primary" />
        <v-alert v-if="errorMessage" type="error" class="my-3">
          {{ errorMessage }}
        </v-alert>

        <!-- Available Rooms -->
        <v-list dense>
          <v-list-item
            v-for="room in availableRooms"
            :key="room.room_id"
            @click="selectedRoom = room"
            :class="{ 'selected-room': selectedRoom?.room_id === room.room_id }"
          >
            <template #prepend>
              <v-icon v-if="selectedRoom?.room_id === room.room_id" color="primary"
                >mdi-check-circle</v-icon
              >
            </template>
            <v-list-item-title>
              Room {{ room.room_number }} — Capacity: {{ room.capacity }} /
              {{ room.currentOccupancy }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Bed Side Selection -->
        <v-radio-group
          v-if="selectedRoom"
          v-model="bedSide"
          label="Bed Side"
          :disabled="!selectedRoom"
          class="mt-4"
        >
          <v-radio
            v-for="side in selectedRoom?.availableSides"
            :key="side"
            :label="side"
            :value="side"
          />
        </v-radio-group>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="closeModal">Cancel</v-btn>
        <v-btn
          color="primary"
          :disabled="!selectedRoom || !bedSide"
          :loading="assigning"
          @click="handleAssign"
        >
          Assign Room
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.selected-room {
  background-color: rgba(33, 150, 243, 0.1);
  border-radius: 8px;
}

.v-list-item {
  cursor: pointer;
}

.v-list-item:hover {
  background-color: rgba(33, 150, 243, 0.05);
  border-radius: 8px;
}
</style>
