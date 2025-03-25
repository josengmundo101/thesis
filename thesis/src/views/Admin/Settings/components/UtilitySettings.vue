<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
import { onMounted, ref } from 'vue'

// Import the store
const store = useUtilityStore()
const loading = ref(false) // For save button state

// Fetch settings on mount
onMounted(async () => {
  await store.fetchSettings()
})

// Save changes explicitly
const handleSave = async () => {
  loading.value = true
  try {
    await store.saveChanges()
  } catch (error) {
    console.error('Error saving settings:', error)
  } finally {
    loading.value = false
  }
}

// Reset to default values
const handleReset = () => {
  store.resetDefaults()
}
</script>

<template>
  <v-card class="settings-card" elevation="3" rounded="lg">
    <v-toolbar flat color="surface" class="px-4 settings-toolbar" height="64">
      <v-icon size="24" color="primary" class="mr-2">mdi-cog</v-icon>
      <v-toolbar-title class="text-h5 font-weight-bold">Utility Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip size="small" color="grey-lighten-3" variant="flat" class="mr-2">
        <v-icon start size="small">mdi-calendar-clock</v-icon>
        Updated: {{ store.updatedAt || new Date().toLocaleDateString() }}
      </v-chip>
    </v-toolbar>

    <v-card-text>
      <v-text-field
        label="Electricity (₱)"
        v-model="store.electricity"
        type="number"
        outlined
        dense
      />
      <v-text-field label="Water (₱)" v-model="store.water" type="number" outlined dense />
      <v-text-field label="Internet (₱)" v-model="store.wifi" type="number" outlined dense />
    </v-card-text>

    <v-card-actions class="pa-4 d-flex justify-space-between bg-grey-lighten-5">
      <v-btn variant="text" color="grey" prepend-icon="mdi-restore" @click="handleReset">
        Reset to Defaults
      </v-btn>
      <div>
        <v-btn :loading="loading" color="primary" @click="handleSave"> Apply Changes </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.settings-card {
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.settings-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.settings-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.v-card-actions {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
}
</style>
