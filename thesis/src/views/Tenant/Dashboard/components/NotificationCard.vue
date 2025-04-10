<script setup>
import { watch } from 'vue'

const { notifications } = defineProps({
  notifications: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['clear-notifications'])

console.log(
  'NotificationCard - Received notifications on setup:',
  JSON.stringify(notifications, null, 2),
)

watch(
  () => notifications,
  (newNotifications) => {
    console.log(
      'NotificationCard - Notifications updated:',
      JSON.stringify(newNotifications, null, 2),
    )
  },
  { deep: true },
)

const handleClearNotifications = () => {
  emit('clear-notifications')
}
</script>

<template>
  <v-card elevation="1" class="notification-card">
    <v-card-title class="text-h6 font-weight-bold d-flex justify-space-between align-center">
      <span>Notifications</span>
      <v-btn
        v-if="notifications.length > 0"
        variant="text"
        color="error"
        size="small"
        @click.stop="handleClearNotifications"
        :disabled="notifications.length === 0"
      >
        Clear All
      </v-btn>
    </v-card-title>

    <v-divider class="my-2"></v-divider>

    <v-virtual-scroll
      v-if="notifications.length > 0"
      :items="notifications"
      height="400"
      item-height="80"
      class="notification-scroller"
    >
      <template v-slot:default="{ item }">
        <v-list-item
          :class="`notification-item notification-${item.type || 'info'}`"
          :key="item.id"
        >
          <template #prepend>
            <v-icon :color="getIconColor(item.type)" class="mr-3" size="small">
              {{ getIcon(item.type) }}
            </v-icon>
          </template>

          <v-list-item-title class="notification-message">
            {{ item.message }}
          </v-list-item-title>
          <v-list-item-subtitle class="notification-time">
            {{ formatDate(item.created_at) }}
          </v-list-item-subtitle>
        </v-list-item>
      </template>
    </v-virtual-scroll>

    <v-alert v-else type="info" variant="tonal" class="mt-4"> No new notifications </v-alert>
  </v-card>
</template>

<script>
export default {
  methods: {
    getIconColor(type) {
      return (
        {
          error: 'error',
          success: 'success',
          reminder: 'warning',
          info: 'info',
          payment_approval: 'warning',
          payment_approved: 'success',
          payment_rejected: 'error',
        }[type] || 'warning'
      )
    },
    getIcon(type) {
      return (
        {
          error: 'mdi-alert-circle',
          success: 'mdi-check-circle',
          reminder: 'mdi-bell-alert',
          info: 'mdi-information',
          payment_approval: 'mdi-clock-outline',
          payment_approved: 'mdi-check-circle',
          payment_rejected: 'mdi-close-circle',
        }[type] || 'mdi-bell'
      )
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    },
  },
}
</script>

<style scoped>
.notification-card {
  min-height: 300px;
  display: flex;
  flex-direction: column;
}

.notification-scroller {
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  border-left: 4px solid;
  margin: 4px 0;
  padding: 8px;
  transition: all 0.2s ease-out;
}

.notification-error {
  border-left-color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.05);
}

.notification-success {
  border-left-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.05);
}

.notification-info {
  border-left-color: rgb(var(--v-theme-info));
  background-color: rgba(var(--v-theme-info), 0.05);
}

.notification-reminder {
  border-left-color: rgb(var(--v-theme-warning));
  background-color: rgba(var(--v-theme-warning), 0.05);
}

.notification-payment_approval {
  border-left-color: rgb(var(--v-theme-warning));
  background-color: rgba(var(--v-theme-warning), 0.05);
}

.notification-payment_approved {
  border-left-color: rgb(var(--v-theme-success));
  background-color: rgba(var(--v-theme-success), 0.05);
}

.notification-payment_rejected {
  border-left-color: rgb(var(--v-theme-error));
  background-color: rgba(var(--v-theme-error), 0.05);
}

.notification-message {
  white-space: normal;
  line-height: 1.4;
  font-size: 0.875rem;
}

.notification-time {
  font-size: 0.7rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.notification-scroller::-webkit-scrollbar {
  width: 6px;
}
.notification-scroller::-webkit-scrollbar-thumb {
  background-color: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 3px;
}
</style>
