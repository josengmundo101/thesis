<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'
import { useToast } from 'vue-toastification'

const props = defineProps({
  modelValue: Boolean,
  tenant: Object,
})

const emit = defineEmits(['update:modelValue', 'rate-updated'])

const localOpen = ref(false)
const rent = ref('')
const water = ref('')
const electricity = ref('')
const wifi = ref('')
const loading = ref(false)

const toast = useToast()

// Watch for dialog open
watch(
  () => props.modelValue,
  async (newVal) => {
    localOpen.value = newVal
    if (newVal && props.tenant?.user_id) {
      await fetchTenantRates()
    }
  },
)

watch(localOpen, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

const resetForm = () => {
  rent.value = ''
  water.value = ''
  electricity.value = ''
  wifi.value = ''
}

const fetchTenantRates = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('tenant_rates')
    .select('*')
    .eq('user_id', props.tenant.user_id)
    .maybeSingle()

  if (error) {
    toast.error('⚠️ Failed to fetch rates.')
  } else if (data) {
    rent.value = data.rent_rate ?? ''
    water.value = data.water_rate ?? ''
    electricity.value = data.electricity_rate ?? ''
    wifi.value = data.wifi_rate ?? ''
  }

  loading.value = false
}

const saveRates = async () => {
  const { error } = await supabase.from('tenant_rates').upsert({
    user_id: props.tenant.user_id,
    rent_rate: parseFloat(rent.value),
    water_rate: parseFloat(water.value),
    electricity_rate: parseFloat(electricity.value),
    wifi_rate: parseFloat(wifi.value),
  })

  if (error) {
    toast.error('❌ Failed to save rates.')
  } else {
    toast.success('✅ Rates saved successfully.')
    emit('rate-updated')
    localOpen.value = false
  }
}
</script>

<template>
  <v-dialog v-model="localOpen" max-width="500px" persistent>
    <v-card>
      <v-card-title class="text-h6">Set Custom Rates</v-card-title>
      <v-card-text>
        <v-text-field v-model="rent" label="Rent Rate" type="number" :disabled="loading" />
        <v-text-field v-model="water" label="Water Rate" type="number" :disabled="loading" />
        <v-text-field
          v-model="electricity"
          label="Electricity Rate"
          type="number"
          :disabled="loading"
        />
        <v-text-field v-model="wifi" label="Wi-Fi Rate" type="number" :disabled="loading" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="localOpen = false" :disabled="loading">Cancel</v-btn>
        <v-btn color="primary" @click="saveRates" :loading="loading">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
