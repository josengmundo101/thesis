<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

// Navigation links
const menuItems = [
  { title: 'Overview', icon: 'mdi-view-dashboard', to: '/tenant/TenantDashboard' },
  { title: 'Payment', icon: 'mdi-credit-card', to: '/tenant/TenantPayment' },
  { title: 'History', icon: 'mdi-history', to: '/tenant/TenantHistory' },
]

// Profile dropdown
const profileMenu = ref(false)

// Logout function (replace with actual logic)
const logout = () => {
  console.log('User logged out')
}

const route = useRoute()
</script>

<template>
  <!-- Navbar -->
  <v-app-bar flat height="70" class="px-6 bg-white">
    <v-container class="d-flex align-center justify-space-between">
      <!-- Logo -->
      <RouterLink to="/tenant/TenantDashboard" class="logo">
        BOARDING HOUSE <sup>TENANT</sup>
      </RouterLink>

      <!-- Navigation Links -->
      <v-toolbar-items class="d-none d-md-flex">
        <v-btn
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          variant="text"
          class="text-body-1 font-weight-medium mx-4"
          :class="{ 'active-link': route.path === item.to }"
        >
          <v-icon class="mr-2">{{ item.icon }}</v-icon>
          {{ item.title }}
        </v-btn>
      </v-toolbar-items>

      <!-- User Profile Dropdown -->
      <v-menu v-model="profileMenu" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="text-none" variant="text">
            <v-avatar size="40" class="mr-2">
              <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="User Avatar" />
            </v-avatar>
            John Doe
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item @click="logout">
            <v-list-item-title> <v-icon class="mr-2">mdi-logout</v-icon> Logout </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </v-app-bar>
</template>

<style scoped>
/* Navbar */
.v-app-bar {
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Active Link Styling */
.active-link {
  color: #578e7e !important;
  font-weight: 600;
}

/* Typography */
.logo {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  color: #578e7e;
  text-decoration: none;
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
