<template>
  <v-card class="overflow-hidden h-100 hover-scale fade-in delay-100" :class="className">
    <v-card-text class="pa-6 d-flex align-center justify-space-between">
      <!-- Left Section: Label + Value -->
      <div>
        <p class="text-body-2 text-muted mb-1">{{ label }}</p>
        <h3 class="text-h5 font-weight-bold">{{ value }}</h3>
      </div>

      <!-- Right Section: Icon -->
      <v-avatar class="p-2" :class="colorAccent || getIconColorClass(icon)" size="40">
        <v-icon :icon="getIcon(icon)" size="24"></v-icon>
      </v-avatar>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

// Props
defineProps({
  icon: {
    type: String,
    required: true,
    validator: (value) => ['users', 'clock', 'credit-card', 'chart'].includes(value),
  },
  value: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  className: {
    type: String,
    default: '',
  },
})

const getIconColorClass = computed(() => (iconType) => {
  const colorMap = {
    users: 'bg-blue-lighten-4',
    clock: 'bg-amber-lighten-4',
    'credit-card': 'bg-purple-lighten-4',
    chart: 'bg-green-lighten-4',
  }
  return colorMap[iconType] || 'bg-grey-lighten-4'
})

// Computed property for dynamic icons
const getIcon = computed(() => (iconType) => {
  const iconMap = {
    users: 'mdi-account-group',
    clock: 'mdi-clock-outline',
    'credit-card': 'mdi-credit-card-outline',
    chart: 'mdi-chart-bar',
  }
  return iconMap[iconType] || 'mdi-account-group'
})
</script>

<style scoped>
.text-muted {
  color: rgba(0, 0, 0, 0.6);
}
</style>
