import axios from 'axios'

const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

// Use Vercel URL
const REDIRECT_BASE_URL = 'https://web-boarding-house.vercel.app'

export const initiatePayment = async (amount, paymentMethodType) => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not defined')
  }

  try {
    // Step 1: Create Payment Intent
    const intentResponse = await axios.post(
      `${BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            payment_method_allowed: ['card', 'paymaya', 'gcash'],
            description: 'Boarding House Payment',
            success_url: `${REDIRECT_BASE_URL}/tenant/TenantPayment?payment_intent_id={CHECKOUT_SESSION_ID}`,
            failed_url: `${REDIRECT_BASE_URL}/tenant/TenantPayment?error=failed`,
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
    const paymentIntent = intentResponse.data.data
    console.log('✅ Payment Intent Created:', paymentIntent)

    // Step 2: Create Payment Source (for GCash or PayMaya)
    if (paymentMethodType === 'gcash' || paymentMethodType === 'paymaya') {
      const sourceResponse = await axios.post(
        `${BASE_URL}/sources`,
        {
          data: {
            attributes: {
              type: paymentMethodType,
              amount: Math.round(amount * 100),
              currency: 'PHP',
              redirect: {
                success: `${REDIRECT_BASE_URL}/tenant/TenantPayment?payment_intent_id=${paymentIntent.id}`,
                failed: `${REDIRECT_BASE_URL}/tenant/TenantPayment?error=failed`,
              },
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
      const source = sourceResponse.data.data
      console.log('✅ Payment Source Created:', source)

      // Step 3: Attach Source to Payment Intent
      const attachResponse = await axios.post(
        `${BASE_URL}/payment_intents/${paymentIntent.id}/attach`,
        {
          data: {
            attributes: {
              payment_method: source.id,
              return_url: `${REDIRECT_BASE_URL}/tenant/TenantPayment?payment_intent_id=${paymentIntent.id}`,
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
      const updatedIntent = attachResponse.data.data
      console.log('✅ Payment Source Attached:', updatedIntent)
      return updatedIntent
    }

    return paymentIntent
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
