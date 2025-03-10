// ReportPage.vue
<script setup>
import EarningSummaryTable from './components/EarningSummaryTable.vue'
import PendingBalance from './components/PendingBalance.vue'
</script>

<template>
  <v-container class="py-8">
    <div class="dashboard-overview mt-6 mb-8">
      <h1 class="text-h4 font-weight-bold tracking-tight fade-in delay-50">Report</h1>
      <p class="text-body-2 text-grey-darken-1 max-width fade-in delay-100">
        View earnings and pending balances
      </p>
    </div>

    <v-row>
      <v-col>
        <EarningSummaryTable />
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <PendingBalance />
      </v-col>
    </v-row>
  </v-container>
</template>
