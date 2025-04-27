import axios from 'axios'

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { amount } = req.body

  if (!amount || isNaN(amount)) {
    return res.status(400).json({ error: 'Invalid amount' })
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
            success_url: 'http:?payment_intent_id={CHECKOUT_SESSION_ID}',
            failed_url: 'https://your-app.com/payment?error=failed',
          },
        },
      },
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
      },
    )
    res.status(200).json(response.data.data)
  } catch (error) {
    console.error('Error creating payment intent:', error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
}
