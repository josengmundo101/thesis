<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '@/utils/supabase' // ✅ Import Supabase
import { signOut } from '@/api/auth' // ✅ Import your signOut function

// Navigation links
const menuItems = [
  { title: 'Overview', icon: 'mdi-view-dashboard', to: '/tenant/TenantDashboard' },
  { title: 'Payment', icon: 'mdi-credit-card', to: '/tenant/TenantPayment' },
  { title: 'History', icon: 'mdi-history', to: '/tenant/TenantHistory' },
]

// Reactive States
const profileMenu = ref(false)
const loading = ref(false)
const tenantName = ref('Tenant') // ✅ Initialize state
const route = useRoute()
const router = useRouter()

// 🔍 Function to fetch Tenant Details
const fetchTenantDetails = async () => {
  try {
    // 1. Get logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('No user is currently logged in.')

    console.log('✅ User ID:', user.id) // Log User ID

    // 2. Fetch tenant details from the 'users' table
    const { data: tenantData, error: tenantError } = await supabase
      .from('users')
      .select('firstname, lastname')
      .eq('user_id', user.id)
      .single()

    if (tenantError) throw tenantError
    console.log('✅ Tenant Data:', tenantData) // Log Tenant Data

    // ✅ Update reactive state
    if (tenantData) {
      tenantName.value = `${tenantData.firstname} ${tenantData.lastname}` // ✅ Set the name
      console.log('✅ Tenant Name:', tenantName.value)
    }
  } catch (error) {
    console.error('🛑 Error fetching tenant details:', error.message)
  }
}

// 🚀 Call the function on component mount
onMounted(() => {
  fetchTenantDetails()
})

// 🔑 Handle Logout
const handleLogout = async () => {
  try {
    loading.value = true
    const { success, message } = await signOut()
    if (success) {
      router.push('/login') // ✅ Redirect to Tenant Login after logout
    } else {
      console.error('Logout Failed:', message)
    }
  } catch (error) {
    console.error('Logout Error:', error.message)
  } finally {
    loading.value = false
  }
}
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
            {{ tenantName }}
            <!-- ✅ This should work now -->
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item>
            <v-btn :loading="loading" @click="handleLogout">
              <v-icon class="mr-2">mdi-logout</v-icon> Logout
            </v-btn>
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
