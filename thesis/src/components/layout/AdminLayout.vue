<template>
  <v-app>
    <AppNavbar />
    <AppSidebar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import AppNavbar from '@/components/layout/navbar/AppNavbar.vue'
import AppSidebar from '@/components/layout/sidebar/AppSidebar.vue'
</script>
