import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import 'material-design-icons-iconfont/dist/material-design-icons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import App from './App.vue'
import './index.css'
import router from './router'

const app = createApp(App)

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    iconFont: ['md', 'fa'],
  },
  defaults: {
    global: {
      style: {
        fontFamily: 'Poppins, sans-serif',
      },
    },
  },
  components,
  directives,
  // main.js
})

app.use(createPinia())
app.use(router)
app.use(vuetify)

app.mount('#app')
