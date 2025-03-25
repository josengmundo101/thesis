<script setup>
import { useUtilityStore } from '@/stores/useUtilityStore'
const store = useUtilityStore()
</script>

<template>
  <v-card elevation="1" class="hover-sclae fade-in delay-100">
    <v-card-title class="text-h6 font-weight-bold">Bill Summary</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-list density="compact">
        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="amber">mdi-lightning-bolt</v-icon>
          </template>
          <v-list-item-title>Electricity</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.electricity }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="blue">mdi-water</v-icon>
          </template>
          <v-list-item-title>Water</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.water }}
          </v-list-item-subtitle>
        </v-list-item>

        <v-list-item>
          <template v-slot:prepend>
            <v-icon color="green">mdi-wifi</v-icon>
          </template>
          <v-list-item-title>Internet</v-list-item-title>
          <v-list-item-subtitle class="font-weight-bold text-primary">
            ₱{{ store.wifi }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>
