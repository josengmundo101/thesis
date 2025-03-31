<script setup>
import { useNotificationStore } from '@/stores/useNotificationStore'
import { computed } from 'vue'

const notificationStore = useNotificationStore()

// ✅ Use computed to ensure Vue tracks updates
const notifications = computed(() => notificationStore.notifications)
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Notifications</v-card-title>
    <v-divider></v-divider>

    <!-- ✅ Show notifications only when available -->
    <v-list v-if="notifications.length">
      <v-list-item v-for="note in notifications" :key="note.id">
        <v-list-item-title>{{ note.message }}</v-list-item-title>
      </v-list-item>
    </v-list>

    <v-alert v-else type="info" variant="tonal"> No new notifications. </v-alert>
  </v-card>
  <p>DEBUG: {{ notifications }}</p>
  <!-- 🔴 Add this for debugging -->
</template>
