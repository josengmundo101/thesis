import { supabase } from '@/utils/supabase'

// ✅ Function to Add Monthly Due
export const addMonthlyDue = async () => {
  try {
    // Get today's date
    const today = new Date()
    const nextMonth = new Date(today.setMonth(today.getMonth() + 1)).toISOString().slice(0, 10)

    // Fetch all invoices with pending or overdue status
    const { data: dueInvoices, error } = await supabase
      .from('invoices')
      .select('*')
      .or('status.eq.Pending,due_date.lt.now()')

    if (error) throw error

    if (dueInvoices.length === 0) {
      console.log('No pending or overdue invoices to update.')
      return
    }

    // Loop through each due invoice and update outstanding balance
    for (const invoice of dueInvoices) {
      const newOutstanding = invoice.outstanding_balance + invoice.total_amount

      // Update the invoice with the new outstanding balance and next month's due date
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          outstanding_balance: newOutstanding,
          due_date: nextMonth,
        })
        .eq('invoice_id', invoice.invoice_id)

      if (updateError) throw updateError

      console.log(`✅ Updated Invoice ${invoice.invoice_id}: New Outstanding = ₱${newOutstanding}`)
    }
  } catch (error) {
    console.error('⚠️ Error adding monthly due:', error.message)
  }
}
