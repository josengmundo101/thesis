<template>
  <v-card class="pa-4 fade-in delay-100" flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h6 font-weight-medium">Room Revenue</span>
      <v-btn
        color="primary"
        variant="tonal"
        prepend-icon="mdi-printer"
        @click="printChart"
        :loading="isPrinting"
      >
        Print Report
      </v-btn>
    </v-card-title>

    <v-card-text>
      <div class="chart-container">
        <VueApexCharts
          v-if="series[0].data.length > 0"
          type="bar"
          height="300"
          :options="chartOptions"
          :series="series"
        />
        <v-alert v-else type="info">
          {{ loadingMessage }}
        </v-alert>
      </div>
    </v-card-text>
  </v-card>

  <!-- Printable Template (hidden in normal view) -->
  <div v-if="false" class="printable-content">
    <div class="print-header">
      <h2>Room Revenue Report</h2>
      <p>Generated on: {{ new Date().toLocaleDateString() }}</p>
    </div>

    <div class="print-body">
      <div class="revenue-summary">
        <h3>Revenue by Room</h3>
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(revenue, room) in roomRevenueMap" :key="room">
              <td>Room {{ room }}</td>
              <td>₱{{ revenue.toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="total-revenue">
        <p><strong>Total Revenue:</strong> ₱{{ totalRevenue.toLocaleString() }}</p>
      </div>
    </div>

    <div class="print-footer">
      <p>End of Report</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '@/utils/supabase'
import VueApexCharts from 'vue3-apexcharts'

const roomRevenueMap = ref({})
const isLoading = ref(true)
const loadingMessage = ref('Loading revenue data...')
const isPrinting = ref(false)

const chartOptions = ref({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  xaxis: { categories: [] },
  colors: ['#4CAF50'],
  yaxis: {
    title: { text: 'Total Revenue (₱)' },
    labels: {
      formatter: (value) => `₱${value.toLocaleString()}`,
    },
  },
  tooltip: {
    y: { formatter: (value) => `₱${value.toLocaleString()}` },
  },
})

const series = ref([{ name: 'Revenue', data: [] }])
const totalRevenue = ref(0)

const printChart = () => {
  isPrinting.value = true

  // Create a clone of the printable content
  const printContent = document.createElement('div')
  printContent.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Room Revenue Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          .printable-content { width: 100%; max-width: 800px; margin: 0 auto; }
          .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
          .print-header h2 { color: #4CAF50; margin-bottom: 5px; }
          .print-header p { color: #666; }
          .revenue-summary { margin: 20px 0; }
          .revenue-summary h3 { color: #4CAF50; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th { background-color: #4CAF50; color: white; text-align: left; padding: 8px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background-color: #f2f2f2; }
          .total-revenue { text-align: right; font-size: 1.2em; font-weight: bold; margin-top: 20px; }
          .print-footer { margin-top: 30px; text-align: center; color: #666; font-size: 0.9em; }
          @page { size: auto; margin: 10mm; }
        </style>
      </head>
      <body>
        <div class="print-header">
          <h2>Room Revenue Report</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="print-body">
          <div class="revenue-summary">
            <h3>Revenue by Room</h3>
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(roomRevenueMap.value)
                  .map(
                    ([room, revenue]) => `
                  <tr>
                    <td>Room ${room}</td>
                    <td>₱${revenue.toLocaleString()}</td>
                  </tr>
                `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
          
          <div class="total-revenue">
            <p><strong>Total Revenue:</strong> ₱${totalRevenue.value.toLocaleString()}</p>
          </div>
        </div>
        
        <div class="print-footer">
          <p>End of Report</p>
        </div>
      </body>
      </html>
    `

  // Open a new window for printing
  const printWindow = window.open('', '_blank')
  printWindow.document.open()
  printWindow.document.write(printContent.innerHTML)
  printWindow.document.close()

  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
    isPrinting.value = false
  }
}

const fetchRoomRevenue = async () => {
  try {
    isLoading.value = true
    loadingMessage.value = 'Loading revenue data...'

    // Fetch payment data (approved payments)
    const { data: payments, error: paymentsError } = await supabase
      .from('payment')
      .select('amount, user_id')
      .eq('status', 'approved')

    if (paymentsError) throw paymentsError

    if (!payments || payments.length === 0) {
      loadingMessage.value = 'No approved payments found'
      return
    }

    // Fetch room assignments for paying users
    const { data: assignments, error: assignmentsError } = await supabase
      .from('bed_assignment')
      .select('user_id, room_id')
      .in(
        'user_id',
        payments.map((p) => p.user_id),
      )

    if (assignmentsError) throw assignmentsError

    if (!assignments || assignments.length === 0) {
      loadingMessage.value = 'No room assignments found for paying users'
      return
    }

    // Fetch room numbers
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('room_id, room_number')
      .in(
        'room_id',
        assignments.map((a) => a.room_id),
      )

    if (roomsError) throw roomsError

    // Process the data into a roomRevenue map
    const userToRoomMap = new Map(assignments.map((a) => [a.user_id, a.room_id]))
    const roomIdToNumberMap = new Map(rooms.map((r) => [r.room_id, r.room_number]))
    const revenueMap = {}

    payments.forEach((payment) => {
      const roomId = userToRoomMap.get(payment.user_id)
      if (roomId) {
        const roomNumber = roomIdToNumberMap.get(roomId)
        const amount = parseFloat(payment.amount) || 0

        if (roomNumber) {
          revenueMap[roomNumber] = (revenueMap[roomNumber] || 0) + amount
        }
      }
    })

    roomRevenueMap.value = revenueMap

    // Calculate total revenue
    totalRevenue.value = Object.values(revenueMap).reduce((sum, revenue) => sum + revenue, 0)

    // Update chart data
    const sortedRooms = Object.entries(revenueMap).sort((a, b) => b[1] - a[1])
    chartOptions.value.xaxis.categories = sortedRooms.map(([num]) => `Room ${num}`)
    series.value[0].data = sortedRooms.map(([, revenue]) => revenue)
  } catch (error) {
    console.error('Error fetching room revenue:', error)
    loadingMessage.value = 'Error loading revenue data'
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchRoomRevenue)
</script>

<style scoped>
.chart-container {
  width: 100%;
  min-height: 300px;
}

/* Hide printable content in normal view */
.printable-content {
  display: none;
}
</style>
