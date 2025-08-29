<script setup>
import { ref, defineProps, defineEmits, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'

const props = defineProps({
  modelValue: Boolean,
  tenant: Object,
})
const emit = defineEmits(['update:modelValue', 'roomAssigned'])
const toast = useToast()

const selectedRoom = ref(null)
const bedSide = ref(null)
const availableRooms = ref([])
const loading = ref(false)
const assigning = ref(false)
const errorMessage = ref('')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const fetchAvailableRooms = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
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
      availableRooms.value = []
      return
    }

    availableRooms.value = data.map((room) => {
      const assignedSides = room.bed_assignment?.map((b) => b.bed_side) || []
      const topBeds = assignedSides.filter((side) => side === 'top').length
      const bottomBeds = assignedSides.filter((side) => side === 'bottom').length
      const maxPerSide = room.capacity / 2
      const isTopFull = topBeds >= maxPerSide
      const isBottomFull = bottomBeds >= maxPerSide
      const isFull = isTopFull && isBottomFull

      return {
        ...room,
        topBeds,
        bottomBeds,
        currentOccupancy: assignedSides.length,
        maxPerSide,
        isTopFull,
        isBottomFull,
        isFull,
      }
    })
  } catch (error) {
    errorMessage.value = 'Failed to load rooms. Please try again later.'
    availableRooms.value = []
  } finally {
    loading.value = false
  }
}

const subscribeToRoomChanges = () => {
  supabase
    .channel('public:bed_assignment')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bed_assignment' },
      (payload) => {
        // Refetch rooms on any bed assignment change
        fetchAvailableRooms()
      },
    )
    .subscribe()
}

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
    return null
  }
}

const handleRoomSelect = (room) => {
  if (room.isFull) {
    toast.error(`Room ${room.room_number} is full. Please select another room.`)
    return
  }
  selectedRoom.value = room
}

const handleAssign = async () => {
  if (!selectedRoom.value || !bedSide.value) {
    toast.error('Please select a room and bed side.')
    return
  }

  if (
    (bedSide.value === 'top' && selectedRoom.value.isTopFull) ||
    (bedSide.value === 'bottom' && selectedRoom.value.isBottomFull)
  ) {
    toast.error(`The ${bedSide.value} side of Room ${selectedRoom.value.room_number} is full.`)
    return
  }

  assigning.value = true
  try {
    const existingAssignment = await fetchExistingAssignment()

    let response
    if (existingAssignment) {
      response = await supabase
        .from('bed_assignment')
        .update({
          room_id: selectedRoom.value.room_id,
          bed_side: bedSide.value,
          date_assigned: new Date().toISOString(),
        })
        .eq('user_id', props.tenant.user_id)
    } else {
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

    const { error: notificationError } = await supabase.from('notifications').insert({
      message: `You have been assigned to Room ${selectedRoom.value.room_number} (${bedSide.value.toUpperCase()}).`,
      type: 'info',
      user_id: props.tenant.user_id,
      status: 'unread',
      timestamp: new Date().toISOString(),
    })

    if (notificationError) throw notificationError

    emit('roomAssigned', {
      ...props.tenant,
      room_id: selectedRoom.value.room_id,
      bed_side: bedSide.value,
    })

    toast.success(
      `Room ${selectedRoom.value.room_number} (${bedSide.value.toUpperCase()}) assigned successfully!`,
    )
    closeModal()
    // No need to manually refetch here; subscription will handle it
  } catch (error) {
    toast.error('Failed to assign room. Please try again.')
  } finally {
    assigning.value = false
  }
}

const closeModal = () => {
  selectedRoom.value = null
  bedSide.value = null
  dialogVisible.value = false
}

const isTopDisabled = computed(() => {
  return selectedRoom.value ? selectedRoom.value.isTopFull : false
})

const isBottomDisabled = computed(() => {
  return selectedRoom.value ? selectedRoom.value.isBottomFull : false
})

onMounted(() => {
  fetchAvailableRooms()
  subscribeToRoomChanges()
})

onUnmounted(() => {
  supabase.removeAllChannels() // Clean up subscriptions
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

        <v-list dense>
          <v-list-item
            v-for="room in availableRooms"
            :key="room.room_id"
            @click="handleRoomSelect(room)"
            :class="{ 'selected-room': selectedRoom?.room_id === room.room_id }"
            :disabled="room.isFull"
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
            <v-list-item-subtitle>
              Top: {{ room.topBeds }}/{{ room.maxPerSide }} | Bottom: {{ room.bottomBeds }}/{{
                room.maxPerSide
              }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-if="room.isFull" class="text-red"
              >Room is full</v-list-item-subtitle
            >
          </v-list-item>
        </v-list>

        <v-radio-group
          v-if="selectedRoom"
          v-model="bedSide"
          label="Bed Side"
          class="mt-4"
          :disabled="assigning"
        >
          <v-radio label="Bottom" value="bottom" :disabled="isBottomDisabled" />
          <v-radio label="Top" value="top" :disabled="isTopDisabled" />
        </v-radio-group>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="outlined" @click="closeModal" :disabled="assigning">Cancel</v-btn>
        <v-btn
          color="primary"
          :disabled="!selectedRoom || !bedSide || assigning"
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

.v-list-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-red {
  color: red;
}
</style>
