import { createRouter, createWebHistory } from 'vue-router'
import TenantLogin from '@/views/Auth/TenantLogin.vue'
import AdminLogin from '@/views/Auth/AdminLogin.vue'
import Register from '@/views/Auth/Register.vue'

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
      path: '/admin',
      name: 'admin',
      component: AdminLogin,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
  ],
})

export default router
