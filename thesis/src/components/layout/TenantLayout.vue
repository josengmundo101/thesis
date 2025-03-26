<template>
  <v-app class="gradient-background">
    <TenantAppNavbar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
// import { onMounted } from 'vue'
// import { useUserStore } from '@/stores/useUserStore'
import TenantAppNavbar from '@/components/layout/navbar/TenantAppNavbar.vue'

// const userStore = useUserStore()

// onMounted(async () => {
//   await userStore.fetchUserId()
//   console.log('✅ Fetched User ID:', userStore.userId)
// })
</script>

<style scoped>
.tenant-layout {
  background: linear-gradient(to bottom right, #578e7e → #2c3e50) !important;
}
</style>
