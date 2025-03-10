<script setup>
import { ref } from 'vue'
import RentSetting from './utility/RentSettings.vue'
import WaterSetting from './utility/WaterSettings.vue'
import ElectricitySetting from './utility/ElectricitySettings.vue'
import WifiSetting from './utility/WifiSettings.vue'

// Active tab state
const activeTab = ref(0)

// Utility categories with icons
const utilities = [
  { name: 'Rent', icon: 'mdi-home-city', component: RentSetting, color: 'primary' },
  { name: 'Water', icon: 'mdi-water', component: WaterSetting, color: 'blue' },
  {
    name: 'Electricity',
    icon: 'mdi-lightning-bolt',
    component: ElectricitySetting,
    color: 'amber',
  },
  { name: 'WiFi', icon: 'mdi-wifi', component: WifiSetting, color: 'green' },
]

// Last updated date (you could make this dynamic based on actual data)
const lastUpdated = ref('March 5, 2025')
</script>

<template>
  <v-card class="settings-card" elevation="3" rounded="lg">
    <v-toolbar flat color="surface" class="px-4 settings-toolbar" height="64">
      <v-icon size="24" color="primary" class="mr-2">mdi-cog</v-icon>
      <v-toolbar-title class="text-h5 font-weight-bold">Utility Settings</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-chip size="small" color="grey-lighten-3" variant="flat" class="mr-2">
        <v-icon start size="small">mdi-calendar-clock</v-icon>
        Updated {{ lastUpdated }}
      </v-chip>
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-content-save"> Save Changes </v-btn>
    </v-toolbar>

    <v-divider></v-divider>

    <!-- Desktop view: Tabs layout -->
    <div class="d-none d-md-block">
      <v-tabs
        v-model="activeTab"
        bg-color="surface"
        color="primary"
        align-tabs="center"
        slider-color="primary"
        class="settings-tabs"
      >
        <v-tab
          v-for="utility in utilities"
          :key="utility.name"
          :value="utilities.indexOf(utility)"
          class="py-4"
        >
          <v-icon :icon="utility.icon" class="mr-2" :color="utility.color"></v-icon>
          {{ utility.name }}
        </v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="px-6 py-4">
        <v-window-item
          v-for="utility in utilities"
          :key="utility.name"
          :value="utilities.indexOf(utility)"
        >
          <component :is="utility.component" />
        </v-window-item>
      </v-window>
    </div>

    <!-- Mobile view: Accordion layout -->
    <div class="d-md-none">
      <v-expansion-panels variant="accordion" class="settings-accordion mt-2">
        <v-expansion-panel
          v-for="utility in utilities"
          :key="utility.name"
          :value="utility.name"
          class="mb-2 mx-2 rounded-lg"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-avatar size="32" :color="`${utility.color}-lighten-4`" class="mr-3">
                <v-icon :color="utility.color" :icon="utility.icon"></v-icon>
              </v-avatar>
              <span class="font-weight-medium">{{ utility.name }} Settings</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <component :is="utility.component" />
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-card-actions class="pa-4 d-flex justify-space-between bg-grey-lighten-5">
      <v-btn variant="text" color="grey" prepend-icon="mdi-restore"> Reset to Defaults </v-btn>
      <div>
        <v-btn variant="outlined" color="grey" class="mr-2"> Cancel </v-btn>
        <v-btn color="primary"> Apply Changes </v-btn>
      </div>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.settings-card {
  border-radius: 16px;
  overflow: hidden;
  transition: box-shadow 0.3s;
}

.settings-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1) !important;
}

.settings-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-accordion :deep(.v-expansion-panel-title) {
  min-height: 64px;
}

.settings-accordion :deep(.v-expansion-panel) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Animation for tab transitions */
.v-window-item {
  transition: all 0.3s ease-out;
}

.v-window-item--active {
  animation: fade-in 0.3s forwards;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
