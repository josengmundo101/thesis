<template>
  <v-dialog v-model="localOpen" max-width="800" @update:model-value="emit('update:isOpen', $event)">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        Ledger for {{ tenant?.firstname }} {{ tenant?.lastname }}
        <v-spacer />
        <v-btn
          color="primary"
          variant="tonal"
          prepend-icon="mdi-printer"
          @click="printLedger"
          :loading="isPrinting"
        >
          Print Ledger
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in ledger" :key="entry.id">
              <td>{{ entry.date }}</td>
              <td>{{ entry.description }}</td>
              <td>₱{{ entry.amount_due }}</td>
              <td>₱{{ entry.amount_paid }}</td>
              <td>₱{{ entry.balance }}</td>
              <td>
                <v-chip :color="getStatusColor(entry.status)" dark>{{ entry.status }}</v-chip>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn text @click="emit('update:isOpen', false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/utils/supabase'

const props = defineProps({
  isOpen: Boolean,
  tenant: Object,
})
const emit = defineEmits(['update:isOpen'])

const localOpen = ref(props.isOpen)
const ledger = ref([])
const isPrinting = ref(false)

watch(
  () => props.isOpen,
  (val) => {
    localOpen.value = val
    if (val && props.tenant) fetchLedger()
  },
)

const getStatusColor = (status) => {
  switch (status) {
    case 'Paid':
      return 'green'
    case 'Partial':
      return 'orange'
    case 'Unpaid':
      return 'red'
    default:
      return 'grey'
  }
}

const fetchLedger = async () => {
  try {
    // 1. Fetch tenant invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('total_amount, outstanding_balance, due_date, status')
      .eq('invoice_id', props.tenant.invoice_id)
      .single()

    if (invoiceError) throw invoiceError

    // 2. Fetch payment history for tenant
    const { data: payments, error } = await supabase
      .from('payment')
      .select('amount, payment_date, status')
      .eq('user_id', props.tenant.user_id)
      .order('payment_date', { ascending: true })

    if (error) throw error

    const ledgerData = payments.map((pmt) => {
      const amount_due = invoice.outstanding_balance
      const amount_paid = pmt.amount

      let status = 'Unpaid'
      let balance = amount_due

      if (amount_paid >= amount_due) {
        status = 'Paid'
        balance = 0
      } else if (amount_paid > 0) {
        status = 'Partial'
        balance = amount_due - amount_paid
      }

      return {
        date: pmt.payment_date,
        description: 'Payment',
        amount_due,
        amount_paid,
        balance,
        status,
      }
    })

    ledger.value = ledgerData
  } catch (err) {
    console.error('Ledger fetch error:', err.message)
  }
}

const printLedger = () => {
  isPrinting.value = true

  // Format dates for printing
  const formattedLedger = ledger.value.map((entry) => ({
    ...entry,
    date: new Date(entry.date).toLocaleDateString(),
  }))

  // Calculate totals
  const totalDue = formattedLedger.reduce((sum, entry) => sum + (entry.amount_due || 0), 0)
  const totalPaid = formattedLedger.reduce((sum, entry) => sum + (entry.amount_paid || 0), 0)
  const currentBalance = formattedLedger[formattedLedger.length - 1]?.balance || 0

  const printWindow = window.open('', '_blank')

  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Tenant Ledger - ${props.tenant?.firstname} ${props.tenant?.lastname}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .print-container { max-width: 800px; margin: 0 auto; }
        .print-header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1976D2; padding-bottom: 10px; }
        .print-header h1 { color: #1976D2; margin-bottom: 5px; }
        .print-header p { color: #666; margin-top: 0; }
        .tenant-info { margin-bottom: 20px; }
        .tenant-info p { margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th { background: #1976D2; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        .text-right { text-align: right; }
        .status-paid { color: green; }
        .status-partial { color: orange; }
        .status-unpaid { color: red; }
        .totals { margin-top: 20px; font-weight: bold; }
        .print-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
        @page { size: auto; margin: 10mm; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="print-header">
          <h1>Tenant Ledger</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="tenant-info">
          <p><strong>Tenant:</strong> ${props.tenant?.firstname} ${props.tenant?.lastname}</p>
          <p><strong>Contact:</strong> ${props.tenant?.contact_number || 'N/A'}</p>
          <p><strong>Room:</strong> ${props.tenant?.room_number || 'N/A'}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount Due</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${formattedLedger
              .map(
                (entry) => `
              <tr>
                <td>${entry.date}</td>
                <td>${entry.description}</td>
                <td class="text-right">₱${entry.amount_due?.toLocaleString() || '0.00'}</td>
                <td class="text-right">₱${entry.amount_paid?.toLocaleString() || '0.00'}</td>
                <td class="text-right">₱${entry.balance?.toLocaleString() || '0.00'}</td>
                <td class="status-${entry.status.toLowerCase()}">${entry.status}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
        
        <div class="totals">
          <p>Total Due: ₱${totalDue.toLocaleString()}</p>
          <p>Total Paid: ₱${totalPaid.toLocaleString()}</p>
          <p>Current Balance: ₱${currentBalance.toLocaleString()}</p>
        </div>
        
        <div class="print-footer">
          <p>End of Report • Generated by Tenant Management System</p>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.open()
  printWindow.document.write(printContent)
  printWindow.document.close()

  printWindow.onload = () => {
    printWindow.focus()
    printWindow.print()
    printWindow.close()
    isPrinting.value = false
  }
}
</script>
