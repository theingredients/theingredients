import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import './BuyMeACoffee.css'

const BuyMeACoffee = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    // Check for success or canceled parameters from Stripe redirect
    const successParam = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (successParam) {
      // Payment was successful (sessionId is optional for testing, but Stripe always provides it)
      setSuccess('Thank you for your support! Your payment was successful. You will be remembered and always be a part of this journey!')
      setError(null)
      // Clean up URL parameters
      setSearchParams({}, { replace: true })
    } else if (canceled) {
      // Payment was canceled
      setError(null) // Don't show error for cancellation
      setSuccess(null)
      // Clean up URL parameters
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handlePayment = async (amount: string) => {
    setIsProcessing(true)
    setError(null)
    setSuccess(null)

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

  // Test function to simulate successful payment (development only)
  const handleTestSuccess = () => {
    setSuccess('Thank you for your support! Your payment was successful. You will be remembered and always be a part of this journey!')
    setError(null)
  }

  return (
    <div className="buy-coffee-container">
      <div className="buy-coffee-content">
        {success && (
          <div className="buy-coffee-success">
            {success}
          </div>
        )}
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

        {/* Test button - only visible in development */}
        {import.meta.env.DEV && (
          <button
            className="buy-coffee-test-button"
            onClick={handleTestSuccess}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              background: 'rgba(0, 0, 0, 0.05)',
              border: '1px dashed rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              cursor: 'pointer',
              color: 'rgba(0, 0, 0, 0.6)',
            }}
          >
            🧪 Test Success Message
          </button>
        )}
      </div>
    </div>
  )
}

export default BuyMeACoffee

