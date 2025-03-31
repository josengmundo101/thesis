import { supabase } from '@/utils/supabase'

// ✅ Function to Process Monthly Payment
export const processMonthlyPayment = async (invoice_id, payment_amount) => {
  try {
    // Fetch the current invoice
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('invoice_id', invoice_id)
      .single()

    if (error) throw error
    if (!invoice) throw new Error('Invoice not found.')

    // Check if full payment was made
    const isFullyPaid = payment_amount >= invoice.outstanding_balance

    // ✅ Calculate Next Month's Due Date
    const today = new Date()
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    if (nextMonthDate.getDate() !== today.getDate()) nextMonthDate.setDate(0) // Adjust for short months
    const nextMonthDue = nextMonthDate.toISOString().slice(0, 10)

    // Determine the new outstanding balance
    const newOutstanding = isFullyPaid ? 0 : invoice.outstanding_balance - payment_amount

    // ✅ Update invoice with correct status and due date
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        outstanding_balance: newOutstanding, // Set to 0 if fully paid
        status: isFullyPaid ? 'approved' : 'pending', // Only "Approved" or "Pending"
        due_date: nextMonthDue, // Always update the due date
      })
      .eq('invoice_id', invoice_id)

    if (updateError) throw updateError

    console.log(`✅ Invoice ${invoice_id} updated: Outstanding = ₱${newOutstanding}`)
  } catch (error) {
    console.error('⚠️ Error processing payment:', error.message)
  }
}
