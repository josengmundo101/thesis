<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase'
import { useDisplay } from 'vuetify' // Import useDisplay composable

// Navigation links
const menuItems = [
  { title: 'Overview', icon: 'mdi-view-dashboard', to: '/tenant/TenantDashboard' },
  { title: 'Payment', icon: 'mdi-credit-card', to: '/tenant/TenantPayment' },
]

// Reactive States
const profileMenu = ref(false)
const mobileMenu = ref(false)
const loading = ref(false)
const tenantName = ref('Tenant')
const route = useRoute()
const router = useRouter()

// Access Vuetify display breakpoints
const { smAndDown } = useDisplay() // Destructure smAndDown from useDisplay

// Function to fetch Tenant Details
const fetchTenantDetails = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('No user is currently logged in.')

    console.log('✅ User ID:', user.id)

    const { data: tenantData, error: tenantError } = await supabase
      .from('users')
      .select('firstname, lastname')
      .eq('user_id', user.id)
      .single()

    if (tenantError) throw tenantError
    console.log('✅ Tenant Data:', tenantData)

    if (tenantData) {
      tenantName.value = `${tenantData.firstname} ${tenantData.lastname}`
      console.log('✅ Tenant Name:', tenantName.value)
    }
  } catch (error) {
    console.error('🛑 Error fetching tenant details:', error.message)
  }
}

// Handle Logout
const handleLogout = async () => {
  await supabase.auth.signOut()
  localStorage.clear()
  router.push('/login')
}

// Call the function on component mount
onMounted(() => {
  fetchTenantDetails()
})
</script>

<template>
  <!-- Navbar -->
  <v-app-bar flat :height="smAndDown ? 60 : 70" class="px-6 bg-white">
    <v-container class="d-flex align-center justify-space-between pa-0">
      <!-- Hamburger Menu for Mobile -->
      <v-btn
        icon
        class="d-md-none"
        @click="mobileMenu = !mobileMenu"
        :aria-label="mobileMenu ? 'Close menu' : 'Open menu'"
      >
        <v-icon size="28">{{ mobileMenu ? 'mdi-close' : 'mdi-menu' }}</v-icon>
      </v-btn>

      <!-- Logo -->
      <RouterLink to="/tenant/TenantDashboard" class="logo">
        BOARDING HOUSE <sup>TENANT</sup>
      </RouterLink>

      <!-- Spacer for Desktop -->
      <v-spacer class="d-none d-md-block"></v-spacer>

      <!-- Navigation Links (Desktop) -->
      <div class="center-links d-none d-md-flex">
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
      </div>

      <!-- User Profile Dropdown -->
      <v-menu v-model="profileMenu" offset-y>
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="text-none profile-btn" variant="text">
            <v-avatar :size="smAndDown ? 32 : 40" class="mr-2">
              <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="User Avatar" />
            </v-avatar>
            <span :class="smAndDown ? 'text-caption' : ''">
              {{ tenantName }}
            </span>
            <v-icon right :size="smAndDown ? 20 : 24">mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-btn block :loading="loading" @click="handleLogout">
              <v-icon class="mr-2">mdi-logout</v-icon> Logout
            </v-btn>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-container>
  </v-app-bar>

  <!-- Mobile Menu (Drawer) -->
  <v-navigation-drawer v-model="mobileMenu" temporary fixed width="250" class="mobile-menu">
    <v-list dense>
      <v-list-item class="pa-4">
        <RouterLink to="/tenant/TenantDashboard" class="logo">
          BOARDING HOUSE <sup>TENANT</sup>
        </RouterLink>
      </v-list-item>
      <v-divider></v-divider>
      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        :to="item.to"
        @click="mobileMenu = false"
        class="py-2"
      >
        <v-list-item-icon>
          <v-icon>{{ item.icon }}</v-icon>
        </v-list-item-icon>
        <v-list-item-title class="text-body-1">
          {{ item.title }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
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
  text-decoration: none;
}

.center-links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}

/* Mobile Adjustments */
@media (max-width: 960px) {
  .v-app-bar {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .logo {
    font-size: 1.25rem; /* Smaller logo on mobile */
  }

  .logo sup {
    font-size: 0.65rem;
  }

  .profile-btn {
    padding: 8px !important; /* Larger touch target for profile dropdown */
  }
}

/* Mobile Menu Styling */
.mobile-menu {
  padding-top: 0 !important;
}

.mobile-menu .v-list-item:hover {
  background-color: rgba(87, 142, 126, 0.1);
}

.mobile-menu .v-list-item-title {
  color: #3d3d3d;
}
</style>
