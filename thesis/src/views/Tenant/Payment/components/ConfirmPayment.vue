<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps(['totalAmount'])
const emit = defineEmits(['confirm'])

const redirectToPayMongo = () => {
  emit('confirm')
}
</script>

<template>
  <v-card elevation="1" class="pa-4 text-center hover-scale fade-in delay-150">
    <v-card-text class="text-h6 font-weight-bold text-primary">
      Total Amount: {{ totalAmount }}
    </v-card-text>
    <v-btn block color="primary" class="py-3" @click="redirectToPayMongo">
      Pay with PayMongo
    </v-btn>
  </v-card>
</template>
