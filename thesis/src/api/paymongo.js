import axios from 'axios'

const PAYMONGO_SECRET_KEY = import.meta.env.VITE_PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

// Dynamic redirect URL based on environment
const REDIRECT_BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5173'
    : 'https://web-boarding-house.vercel.app'

// Utility to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const initiatePayment = async (amount, paymentMethodType) => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not defined')
  }

  let paymentIntent

  const createPaymentIntent = async () => {
    const intentResponse = await axios.post(
      `${BASE_URL}/payment_intents`,
      {
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: 'PHP',
            payment_method_allowed: ['paymaya', 'gcash'],
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
    return intentResponse.data.data
  }

  try {
    // Step 1: Create Payment Intent
    paymentIntent = await createPaymentIntent()
    console.log('✅ Payment Intent Created:', paymentIntent)

    // Validate Payment Intent ID
    if (!paymentIntent.id || !paymentIntent.id.startsWith('pi_')) {
      throw new Error(`Invalid payment intent ID: ${paymentIntent.id}`)
    }

    // Step 2: Verify Payment Intent Exists
    let intentVerified = false
    for (let i = 0; i < 2; i++) {
      try {
        const verifyResponse = await axios.get(`${BASE_URL}/payment_intents/${paymentIntent.id}`, {
          headers: {
            Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
          },
        })
        console.log('✅ Payment Intent Verified Before Attachment:', verifyResponse.data.data)
        intentVerified = true
        break
      } catch (verifyError) {
        console.warn('⚠️ Failed to verify payment intent (Attempt ' + (i + 1) + '):', {
          message: verifyError.message,
          response: verifyError.response?.data,
          status: verifyError.response?.status,
          errors: verifyError.response?.data?.errors,
        })
        if (i === 1) {
          console.log('🟡 Recreating payment intent due to verification failure...')
          paymentIntent = await createPaymentIntent()
          console.log('✅ New Payment Intent Created:', paymentIntent)
          if (!paymentIntent.id || !paymentIntent.id.startsWith('pi_')) {
            throw new Error(`Invalid new payment intent ID: ${paymentIntent.id}`)
          }
        }
      }
    }

    if (!intentVerified) {
      throw new Error('Payment intent verification failed after retries')
    }

    // Step 3: Create Payment Source (for GCash or PayMaya)
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

      // Validate Source ID
      if (!source.id || !source.id.startsWith('src_')) {
        throw new Error(`Invalid source ID: ${source.id}`)
      }

      // Step 4: Create Payment Method from Source
      const paymentMethodResponse = await axios.post(
        `${BASE_URL}/payment_methods`,
        {
          data: {
            attributes: {
              type: paymentMethodType,
              source: source.id,
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
      const paymentMethod = paymentMethodResponse.data.data
      console.log('✅ Payment Method Created:', paymentMethod)

      // Validate Payment Method ID
      if (!paymentMethod.id || !paymentMethod.id.startsWith('pm_')) {
        throw new Error(`Invalid payment method ID: ${paymentMethod.id}`)
      }

      // Step 5: Attach Payment Method with Retry Logic
      let attachResponse
      let retries = 3
      while (retries > 0) {
        try {
          console.log(`⏳ Attempting to attach payment method (Retries left: ${retries})...`)
          await delay(2000) // 2-second delay
          attachResponse = await axios.post(
            `${BASE_URL}/payment_intents/${paymentIntent.id}/attach`,
            {
              data: {
                attributes: {
                  payment_method: paymentMethod.id,
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
          break // Success, exit retry loop
        } catch (attachError) {
          retries--
          console.warn('⚠️ Attachment attempt failed:', {
            message: attachError.message,
            response: attachError.response?.data,
            status: attachError.response?.status,
            errors: attachError.response?.data?.errors,
          })
          if (retries === 0) throw attachError
        }
      }

      const updatedIntent = attachResponse.data.data
      console.log('✅ Payment Method Attached:', updatedIntent)
      return updatedIntent
    }

    throw new Error('Unsupported payment method')
  } catch (error) {
    console.error('⚠️ Error initiating payment:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    })
    throw error
  }
}

export const verifyPaymentIntent = async (paymentIntentId) => {
  if (!PAYMONGO_SECRET_KEY) {
    throw new Error('PAYMONGO_SECRET_KEY is not defined')
  }

  try {
    let response
    let retries = 3
    while (retries > 0) {
      try {
        console.log(`⏳ Attempting to verify payment intent (Retries left: ${retries})...`)
        await delay(1000) // 1-second delay
        response = await axios.get(`${BASE_URL}/payment_intents/${paymentIntentId}`, {
          headers: {
            Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
          },
        })
        break // Success, exit retry loop
      } catch (verifyError) {
        retries--
        console.warn('⚠️ Payment intent verification attempt failed:', {
          message: verifyError.message,
          response: verifyError.response?.data,
          status: verifyError.response?.status,
          errors: verifyError.response?.data?.errors,
        })
        if (retries === 0) throw verifyError
      }
    }

    console.log('✅ Payment Intent Verified:', response.data.data)
    return response.data.data
  } catch (error) {
    console.error('⚠️ Error verifying payment intent:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      errors: error.response?.data?.errors,
    })
    throw error
  }
}
