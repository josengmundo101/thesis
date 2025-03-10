<script setup>
import { defineProps, defineEmits, ref } from 'vue'

// Define props and emits
const props = defineProps({
  modelValue: String,
  placeholder: { type: String, default: 'Search...' },
})
const emit = defineEmits(['update:modelValue'])

const searchQuery = ref(props.modelValue || '')

// Emit changes on input
const updateSearch = () => {
  emit('update:modelValue', searchQuery.value)
}

// Clear search input
const clearSearch = () => {
  searchQuery.value = ''
  updateSearch()
}
</script>

<template>
  <v-text-field
    class="fade-in delay-100"
    v-model="searchQuery"
    :label="placeholder"
    variant="outlined"
    prepend-inner-icon="mdi-magnify"
    clearable
    density="compact"
    @update:modelValue="updateSearch"
    @click:clear="clearSearch"
  />
</template>

<style scoped>
/* Customize search bar if needed */
</style>
