import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '@/utils/supabase'

// Auth Components
import TenantLogin from '@/views/Auth/TenantLogin.vue'
import AdminLogin from '@/views/Auth/AdminLogin.vue'
import Register from '@/views/Auth/Register.vue'

// Admin Components
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Dashboard from '@/views/Admin/Dashboard/Dashboard.vue'
import TenantsPage from '@/views/Admin/Tenants/TenantsPage.vue'
import PaymentPage from '@/views/Admin/Payment/PaymentPage.vue'
import ReportPage from '@/views/Admin/Report/ReportPage.vue'
import SettingsPage from '@/views/Admin/Settings/SettingsPage.vue'

// Tenant Components
import TenantDashboard from '@/views/Tenant/Dashboard/TenantDashboard.vue'
import TenantLayout from '@/components/layout/TenantLayout.vue'
import TenantPayment from '@/views/Tenant/Payment/TenantPayment.vue'
import TenantHistory from '@/views/Tenant/History/TenantHistory.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      redirect: '/login', // Redirect to tenant login by default
    },
    {
      path: '/login',
      name: 'login',
      component: TenantLogin,
    },
    {
      path: '/adminlogin',
      name: 'adminlogin',
      component: AdminLogin,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/admin',
      component: AdminLayout,
      meta: { requiresAuth: true, role: 'admin' }, // Restrict to admin only
      children: [
        { path: 'dashboard', name: 'dashboard', component: Dashboard },
        { path: 'tenants', name: 'tenants', component: TenantsPage },
        { path: 'payments', name: 'payments', component: PaymentPage },
        { path: 'reports', name: 'reports', component: ReportPage },
        { path: 'settings', name: 'settings', component: SettingsPage },
      ],
    },
    {
      path: '/tenant',
      component: TenantLayout,
      meta: { requiresAuth: true, role: 'tenant' }, // Restrict to tenant only
      children: [
        { path: 'tenantDashboard', name: 'tenantDashboard', component: TenantDashboard },
        { path: 'tenantPayment', name: 'tenantPayment', component: TenantPayment },
        { path: 'tenantHistory', name: 'tenantHistory', component: TenantHistory },
      ],
    },
  ],
})

// 🔍 Route Guard for Role-Based Access
router.beforeEach(async (to, from, next) => {
  try {
    const { data: session } = await supabase.auth.getSession() // Get active session
    const role = localStorage.getItem('user_role')

    if (!session?.session && to.meta.requiresAuth) {
      console.warn('⚠️ No active session. Redirecting to login.')
      return next('/login') // Redirect if not logged in
    }

    if (session?.session && to.name === 'login') {
      // Redirect based on role
      const redirectPath = role === 'admin' ? '/admin/dashboard' : '/tenant/tenantDashboard'
      return next(redirectPath)
    }

    next() // Proceed normally
  } catch (error) {
    console.error('❌ Error in route guard:', error)
    next('/login') // Redirect to login on error
  }
})

export default router
