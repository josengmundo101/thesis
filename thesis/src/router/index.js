import { createRouter, createWebHistory } from 'vue-router'
import TenantLogin from '@/views/Auth/TenantLogin.vue'
import AdminLogin from '@/views/Auth/AdminLogin.vue'
import Register from '@/views/Auth/Register.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Dashboard from '@/views/Admin/Dashboard/Dashboard.vue'
import TenantsPage from '@/views/Admin/Tenants/TenantsPage.vue'
import PaymentPage from '@/views/Admin/Payment/PaymentPage.vue'
import ReportPage from '@/views/Admin/Report/ReportPage.vue'
import SettingsPage from '@/views/Admin/Settings/SettingsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
    },
    {
      path: '/login',
      name: 'login',
      component: TenantLogin,
    },
    {
      path: '/adminlogin',
      name: 'admin',
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
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: Dashboard,
        },
        {
          path: 'tenants',
          name: 'tenants',
          component: TenantsPage,
        },
        {
          path: 'payments',
          name: 'payments',
          component: PaymentPage,
        },
        {
          path: 'reports',
          name: 'reports',
          component: ReportPage,
        },
        {
          path: 'settings',
          name: 'settings',
          component: SettingsPage,
        },
        // You can add other admin pages here too
      ],
    },
  ],
})

export default router
