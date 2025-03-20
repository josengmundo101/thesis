<template>
  <v-app class="gradient-background">
    <TenantAppNavbar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import TenantAppNavbar from '@/components/layout/navbar/TenantAppNavbar.vue'
</script>

<style scoped>
.tenant-layout {
  background: linear-gradient(to bottom right, #578e7e → #2c3e50) !important;
}
</style>
