<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  notifications: {
    type: Array,
    required: true,
  },
})

const getNotificationIcon = (note) => {
  if (note.includes('rejected')) return { icon: 'mdi-information', color: 'red' }
  if (note.includes('due')) return { icon: 'mdi-information', color: 'blue' }
  return { icon: 'mdi-check-circle', color: 'green' }
}
</script>

<template>
  <v-card elevation="1" class="pa-5 hover-scale fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Notifications</v-card-title>
    <v-divider></v-divider>
    <v-list density="compact">
      <v-list-item v-for="(note, index) in props.notifications" :key="index">
        <template v-slot:prepend>
          <v-icon :color="getNotificationIcon(note).color">{{
            getNotificationIcon(note).icon
          }}</v-icon>
        </template>
        <v-list-item-title>{{ note }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-card>
</template>
