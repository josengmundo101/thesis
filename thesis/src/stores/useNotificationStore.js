import { defineStore } from 'pinia'
import { ref, toRaw } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])

  // 1. Reliable storage methods
  const saveToStorage = () => {
    try {
      localStorage.setItem(
        'notification-store',
        JSON.stringify({ notifications: toRaw(notifications.value) }), // Remove Proxy
      )
    } catch (error) {
      console.error('Storage error:', error)
      // Handle quota exceeded (e.g., trim old notifications)
      notifications.value = notifications.value.slice(0, 50)
      saveToStorage()
    }
  }

  // 2. Modified addNotification
  const addNotification = (notification) => {
    const newNotif = {
      id: Date.now(),
      ...notification,
      timestamp: new Date().toISOString(),
    }

    notifications.value = [newNotif, ...notifications.value] // New array to trigger reactivity
    saveToStorage() // Explicit save
    return newNotif
  }

  // 3. Initialize (handle both formats)
  const init = () => {
    try {
      const raw = localStorage.getItem('notification-store')
      if (!raw) return

      const data = JSON.parse(raw)
      notifications.value = data?.notifications || []
      console.log('Initialized notifications:', notifications.value)
    } catch (error) {
      console.error('Init error:', error)
      localStorage.removeItem('notification-store') // Clear corrupt data
    }
  }

  init() // Run on store creation

  return { notifications, addNotification, init }
})
