import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])

  // ✅ Load stored notifications when the store initializes
  const loadNotifications = () => {
    const saved = localStorage.getItem('notifications')
    if (saved) {
      notifications.value = JSON.parse(saved)
    }
  }

  // ✅ Add a new notification and store it
  const addNotification = (message) => {
    notifications.value.push({ id: Date.now(), message })
  }

  // ✅ Watch for changes and store updates
  watch(
    notifications,
    (newVal) => {
      localStorage.setItem('notifications', JSON.stringify(newVal))
    },
    { deep: true },
  )

  // ✅ Load data when the store is first created
  loadNotifications()

  return { notifications, addNotification, loadNotifications }
})
