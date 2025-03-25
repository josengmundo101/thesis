<script setup>
import { ref } from 'vue'
import { signOut } from '@/api/auth'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)

// Handle Logout
const handleLogout = async () => {
  loading.value = true
  const { success, message } = await signOut()
  if (success) {
    router.push('/adminLogin') // Redirect to Admin Login after logout
  } else {
    console.error('Logout Failed:', message)
  }
  loading.value = false
}
</script>

<template>
  <v-app-bar flat color="white" app class="px-4">
    <!-- Logo on the left -->
    <RouterLink to="/admin/dashboard" class="flex items-center no-underline">
      <span class="logo">
        BOARDING HOUSE
        <sup>ADMIN</sup>
      </span>
    </RouterLink>

    <!-- Spacer -->
    <v-spacer />

    <!-- Profile Dropdown -->
    <v-menu offset-y>
      <template #activator="{ props }">
        <v-avatar v-bind="props" size="40">
          <v-img src="https://i.pravatar.cc/300" alt="User Avatar" />
        </v-avatar>
      </template>
      <v-list>
        <v-btn :loading="loading" @click="handleLogout" color="red" dark> Logout </v-btn>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.v-app-bar {
  z-index: 10;
}

.logo {
  font-size: 1.75rem; /* Larger text */
  font-weight: 900; /* Extra bold */
  letter-spacing: 0.05em; /* Optional spacing */
  color: #578e7e; /* Replace with your theme primary if needed */
  text-decoration: none; /* Remove underline from the span */
}

.logo sup {
  font-size: 0.75rem;
  font-weight: 600;
  margin-left: 4px;
  color: #3d3d3d;
}

a {
  text-decoration: none; /* Remove underline from RouterLink */
}
</style>
