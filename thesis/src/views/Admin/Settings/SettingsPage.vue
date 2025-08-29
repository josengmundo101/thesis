<script setup>
import AddRoom from './components/AddRoom.vue'
import UtilitySettings from './components/UtilitySettings.vue'
</script>

<template>
  <v-container class="py-8">
    <!-- Page Header -->
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Settings</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        Manage rental, utility, and payment settings.
      </p>
    </div>

    <v-row>
      <v-col cols="12" md="8">
        <UtilitySettings />
      </v-col>
      <v-col cols="12" md="4">
        <AddRoom />
      </v-col>
    </v-row>
  </v-container>
</template>
