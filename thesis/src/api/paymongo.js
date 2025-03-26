import axios from 'axios'

// Load from .env
const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

// Create Payment Intent
export const createPaymentIntent = async (amount) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos (rounded)
            currency: 'PHP',
            payment_method_allowed: ['card', 'paymaya', 'gcash'],
            description: 'Boarding House Payment',
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`, // Base64
          'Content-Type': 'application/json',
        },
      },
    )
    console.log('✅ Payment Intent Created:', response.data)
    return response.data.data
  } catch (error) {
    console.error('⚠️ Error creating payment intent:', error.response?.data || error.message)
    throw error
  }
}
