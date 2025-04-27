<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'
import { useDisplay } from 'vuetify' // Import useDisplay composable

const notifications = ref([])
const loading = ref(false)
const toast = useToast()

// Access Vuetify display breakpoints
const { smAndDown } = useDisplay() // Destructure smAndDown from useDisplay

// Fetch the logged-in user's user_id
const fetchUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error) {
    console.error('Error fetching user:', error)
    return null
  }
  return user?.id
}

// Fetch notifications for the logged-in user
const fetchNotifications = async () => {
  const userId = await fetchUserId()
  if (!userId) {
    toast.error('Failed to fetch user ID. Please log in again.')
    return
  }

  loading.value = true
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'unread')
      .order('timestamp', { ascending: false })

    if (error) throw error

    notifications.value = data.map((notification) => ({
      ...notification,
      isNew: false,
    }))
  } catch (error) {
    console.error('Error fetching notifications:', error)
    toast.error('Failed to load notifications.')
  } finally {
    loading.value = false
  }
}

// Mark a notification as read with animation
const markAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', notificationId)

    if (error) throw error

    const index = notifications.value.findIndex((n) => n.id === notificationId)
    if (index !== -1) {
      notifications.value[index].isLeaving = true
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== notificationId)
      }, 300)
    }

    toast.success('Notification marked as read.')
  } catch (error) {
    console.error('Error marking notification as read:', error)
    toast.error('Failed to mark notification as read.')
  }
}

// Play a notification sound
const playNotificationSound = () => {
  const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3')
  audio.play().catch((error) => {
    console.error('Error playing notification sound:', error)
  })
}

// Real-time subscription for new notifications
let subscription = null
onMounted(async () => {
  await fetchNotifications()

  const userId = await fetchUserId()
  if (userId) {
    subscription = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = { ...payload.new, isNew: true }
          if (newNotification.status === 'unread') {
            notifications.value.unshift(newNotification)
            toast.info('New notification received!', {
              icon: 'mdi-bell-ring',
              timeout: 2000,
            })
            playNotificationSound()
          }
        },
      )
      .subscribe()
  }
})

onUnmounted(() => {
  if (subscription) {
    supabase.removeChannel(subscription)
  }
})
</script>

<template>
  <v-card
    elevation="4"
    class="pa-4 mx-auto notification-card"
    style="border-radius: 12px"
    color="grey-lighten-4"
  >
    <div class="d-flex align-center mb-4 header-container">
      <v-icon color="primary" class="mr-2">mdi-bell</v-icon>
      <h2 class="text-h6 font-weight-bold primary--text">Notifications</h2>
      <v-spacer></v-spacer>
      <v-chip small color="grey-lighten-2" v-if="notifications.length > 0">
        {{ notifications.length }} Unread
      </v-chip>
    </div>

    <v-skeleton-loader
      v-if="loading"
      type="list-item-avatar-two-line@3"
      class="elevation-0"
    ></v-skeleton-loader>

    <v-list v-else-if="notifications.length > 0" dense class="pa-0">
      <v-list-item
        v-for="notification in notifications"
        :key="notification.id"
        class="mb-3 rounded-lg elevation-1 notification-item"
        :class="{
          'fade-in': notification.isNew,
          'slide-out': notification.isLeaving,
          pulse: notification.isNew,
        }"
        style="background: white"
      >
        <v-list-item-avatar size="36">
          <v-icon
            :color="notification.type === 'success' ? 'green' : 'red'"
            :size="smAndDown ? 24 : 28"
          >
            {{ notification.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
        </v-list-item-avatar>

        <v-list-item-content>
          <v-list-item-title
            :class="['font-weight-medium wrap-text', smAndDown ? 'text-caption' : 'text-body-2']"
          >
            <span v-html="formatMessage(notification.message, notification.type)"></span>
          </v-list-item-title>
          <v-list-item-subtitle
            :class="['grey--text mt-1', smAndDown ? 'text-caption' : 'text-caption']"
          >
            {{ new Date(notification.timestamp).toLocaleString() }}
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-btn
            icon
            :small="smAndDown"
            @click="markAsRead(notification.id)"
            :color="notification.type === 'success' ? 'green' : 'red'"
            class="mark-read-btn"
          >
            <v-icon :size="smAndDown ? 20 : 24">mdi-check</v-icon>
          </v-btn>
        </v-list-item-action>
      </v-list-item>
    </v-list>

    <v-alert v-else type="info" text class="text-center rounded-lg" color="primary">
      No unread notifications.
    </v-alert>
  </v-card>
</template>

<style scoped>
@media (max-width: 600px) {
  .notification-card {
    margin: 0 8px; /* Reduced margin on mobile */
    padding: 12px !important; /* Reduced padding on mobile */
  }

  .header-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-container h2 {
    font-size: 1rem; /* Smaller header on mobile */
  }

  .v-chip {
    font-size: 0.75rem; /* Smaller chip text on mobile */
  }

  .notification-item {
    padding: 8px !important; /* Reduced padding for list items */
  }

  .wrap-text {
    line-height: 1.4 !important; /* Tighter line height on mobile */
  }

  .mark-read-btn {
    padding: 8px !important; /* Larger touch target for the button */
  }
}

.notification-item {
  transition: all 0.3s ease;
}

.notification-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

/* Disable hover effect on mobile */
@media (hover: none) {
  .notification-item:hover {
    transform: none;
    box-shadow: none !important;
  }
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-out {
  animation: slideOut 0.3s ease-out forwards;
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
  }
}

.pulse {
  animation: pulse 1.5s infinite;
}

@media (max-width: 600px) {
  .pulse {
    animation: none; /* Disable pulse animation on mobile for performance */
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 150, 136, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0);
  }
}

.wrap-text {
  white-space: normal !important;
  line-height: 1.5;
}

.v-list-item-subtitle {
  margin-top: 2px;
}
</style>

<script>
export default {
  methods: {
    formatMessage(message, type) {
      const amountRegex = /₱\d+/
      const actionRegex = type === 'success' ? /approved/ : /rejected/
      return message
        .replace(amountRegex, '<strong>$&</strong>')
        .replace(
          actionRegex,
          `<strong class="${type === 'success' ? 'green--text' : 'red--text'}">$&</strong>`,
        )
    },
  },
}
</script>
