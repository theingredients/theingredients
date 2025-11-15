import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './BuyMeACoffee.css'

const BuyMeACoffee = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // Check for success or canceled parameters from Stripe redirect
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (success && sessionId) {
      // Payment was successful
      alert('Thank you for your support! Your payment was successful. ☕')
      // Clean up URL parameters
      setSearchParams({}, { replace: true })
    } else if (canceled) {
      // Payment was canceled
      setError(null) // Don't show error for cancellation
      // Clean up URL parameters
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handlePayment = async (amount: string) => {
    setIsProcessing(true)
    setError(null)

    try {
      // Call our API endpoint to create a Stripe Checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          currency: 'usd',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (!url) {
        throw new Error('No checkout URL received')
      }

      // Redirect to Stripe Checkout
      window.location.href = url
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
      console.error('Payment error:', err)
      setIsProcessing(false)
    }
  }

  return (
    <div className="buy-coffee-container">
      <div className="buy-coffee-content">
        <h2 className="buy-coffee-title">Buy Me a Coffee</h2>
        <p className="buy-coffee-description">
          If you enjoy The Ingredients and want to support its development, 
          consider buying me a coffee! ☕
        </p>
        
        {error && (
          <div className="buy-coffee-error">
            {error}
          </div>
        )}

        <div className="buy-coffee-amounts">
          <button
            className="buy-coffee-button"
            onClick={() => handlePayment('3.00')}
            disabled={isProcessing}
            aria-label="Buy a $3 coffee"
          >
            {isProcessing ? 'Processing...' : '$3 Coffee'}
          </button>
          <button
            className="buy-coffee-button"
            onClick={() => handlePayment('5.00')}
            disabled={isProcessing}
            aria-label="Buy a $5 coffee"
          >
            {isProcessing ? 'Processing...' : '$5 Coffee'}
          </button>
          <button
            className="buy-coffee-button"
            onClick={() => handlePayment('10.00')}
            disabled={isProcessing}
            aria-label="Buy a $10 coffee"
          >
            {isProcessing ? 'Processing...' : '$10 Coffee'}
          </button>
        </div>

        <p className="buy-coffee-note">
          Powered by Stripe. Secure payment processing.
        </p>
      </div>
    </div>
  )
}

export default BuyMeACoffee

