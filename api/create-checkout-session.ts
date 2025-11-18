import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'

// Initialize Stripe with secret key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
})

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, currency = 'usd' } = req.body

    // Validate amount
    if (!amount || typeof amount !== 'string') {
      return res.status(400).json({ error: 'Amount is required' })
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Convert to cents (Stripe uses smallest currency unit)
    const amountInCents = Math.round(amountNum * 100)

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ 
        error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' 
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: 'Buy Us a Coffee!',
              description: 'Support The Ingredients Design Collective',
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'https://theingredients.io'}/coffee?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || 'https://theingredients.io'}/coffee?canceled=true`,
      metadata: {
        amount: amount,
        currency: currency,
      },
    })

    // Return the session URL
    return res.status(200).json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Stripe error:', error)
    
    // Return user-friendly error message
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({ 
        error: error.message 
      })
    }
    
    return res.status(500).json({ 
      error: 'An error occurred while creating the checkout session' 
    })
  }
}

