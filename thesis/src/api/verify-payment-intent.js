import axios from 'axios'

const PAYMONGO_SECRET_KEY = VITE.env.PAYMONGO_SECRET_KEY
const BASE_URL = 'https://api.paymongo.com/v1'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Payment intent ID required' })
  }

  try {
    const response = await axios.get(`${BASE_URL}/payment_intents/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${PAYMONGO_SECRET_KEY}:`).toString('base64')}`,
      },
    })
    res.status(200).json(response.data.data)
  } catch (error) {
    console.error('Error verifying payment intent:', error.response?.data || error.message)
    res.status(500).json({ error: error.response?.data || error.message })
  }
}
