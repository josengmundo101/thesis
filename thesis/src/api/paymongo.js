// src/api/paymongo.js
import axios from 'axios'

const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

export const initiatePayment = async (amount) => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not defined')
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100), // Convert to centavos
            currency: 'PHP',
            payment_method_allowed: ['card', 'paymaya', 'gcash'],
            description: 'Boarding House Payment',
            success_url:
              'https://web-boarding-house.vercel.app/tenant/TenantPayment?payment_intent_id={CHECKOUT_SESSION_ID}',
            failed_url: 'https://web-boarding-house.vercel.app/tenant/TenantPayment?error=failed',
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
          'Content-Type': 'application/json',
        },
      },
    )
    console.log('✅ Payment Intent Created:', response.data.data)
    return response.data.data
  } catch (error) {
    console.error('⚠️ Error initiating payment:', error.response?.data || error.message)
    throw error
  }
}

export const verifyPaymentIntent = async (paymentIntentId) => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not defined')
  }

  try {
    const response = await axios.get(`${BASE_URL}/payment_intents/${paymentIntentId}`, {
      headers: {
        Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
      },
    })
    console.log('✅ Payment Intent Verified:', response.data.data)
    return response.data.data
  } catch (error) {
    console.error('⚠️ Error verifying payment intent:', error.response?.data || error.message)
    throw error
  }
}
