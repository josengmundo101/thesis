<template>
  <v-navigation-drawer app permanent color="white" width="260" flat class="sidebar">
    <v-list dense nav>
      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        :to="item.to"
        link
        active-class="active-link"
        class="sidebar-item"
      >
        <template #prepend>
          <v-icon size="22" class="sidebar-icon">{{ item.icon }}</v-icon>
        </template>
        <v-list-item-title class="sidebar-title">
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
const menuItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/admin/dashboard' },
  { title: 'Tenants', icon: 'mdi-account-group', to: '/admin/tenants' },
  { title: 'Payments', icon: 'mdi-credit-card', to: '/admin/payments' },
  { title: 'Reports', icon: 'mdi-file-chart', to: '/admin/reports' },
  { title: 'Settings', icon: 'mdi-cog', to: '/admin/settings' },
]
</script>

<style scoped>
.sidebar {
  border: none;
  padding-top: 20px;
}

.sidebar-item {
  padding: 10px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: background-color 0.3s;
}

.sidebar-icon {
  margin-right: 12px;
  color: #3d3d3d;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 500; /* Light-bold */
  color: #3d3d3d;
}

.active-link {
  background-color: #cfe7db; /* Darker shade of green-lighten-5 */
  color: #578e7e;
  font-weight: 600;
}

.active-link .sidebar-icon,
.active-link .sidebar-title {
  color: #578e7e;
}
</style>
