import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import './PageStyles.css'
import './Contact.css'

const Contact = () => {
  const navigate = useNavigate()
  const [isPressing, setIsPressing] = useState(false)
  const [scale, setScale] = useState(1)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const isPressingRef = useRef<boolean>(false)

  // Calculate the scale needed to fill the screen
  const getMaxScale = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    // Approximate text width at base size (3rem = ~48px)
    const baseTextWidth = 200 // Approximate width of "Contact" at 3rem
    const baseTextHeight = 60 // Approximate height at 3rem
    
    // Calculate scale needed to fill viewport (with some padding)
    const scaleX = (viewportWidth * 0.9) / baseTextWidth
    const scaleY = (viewportHeight * 0.9) / baseTextHeight
    
    // Use the larger scale to ensure it fills the screen
    return Math.max(scaleX, scaleY) * 1.2 // Add 20% extra to ensure it fills
  }

  useEffect(() => {
    if (isPressing) {
      startTimeRef.current = Date.now()
      
      const animate = () => {
        if (!isPressingRef.current) {
          return
        }
        
        const elapsed = Date.now() - (startTimeRef.current || 0)
        const maxScale = getMaxScale()
        
        // Grow over 2 seconds to fill screen, then continue growing slowly
        const duration = 2000
        const progress = Math.min(elapsed / duration, 1)
        
        // Use an easing function for smooth growth
        const easedProgress = 1 - Math.pow(1 - progress, 3) // Ease out cubic
        let newScale = 1 + (maxScale - 1) * easedProgress
        
        // Continue growing slowly after reaching max scale
        if (progress >= 1) {
          const extraTime = elapsed - duration
          const extraScale = (extraTime / 1000) * 0.5 // Slow additional growth
          newScale = maxScale + extraScale
        }
        
        setScale(newScale)
        
        if (isPressingRef.current) {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(animate)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setScale(1)
      startTimeRef.current = null
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPressing])

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients!\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  const handleAudioClick = () => {
    window.open('https://or-six.vercel.app/', '_blank', 'noopener,noreferrer')
  }

  const handleContactPressStart = () => {
    isPressingRef.current = true
    setIsPressing(true)
  }

  const handleContactPressEnd = () => {
    isPressingRef.current = false
    setIsPressing(false)
    // Navigate when user releases
    navigate('/contact-me')
  }

  const handleContactMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleContactPressStart()
  }

  const handleContactMouseUp = () => {
    handleContactPressEnd()
  }

  const handleContactMouseLeave = (e: React.MouseEvent) => {
    // Only stop if mouse button is not pressed
    if (e.buttons === 0) {
      handleContactPressEnd()
    }
  }

  const handleContactTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleContactPressStart()
  }

  const handleContactTouchEnd = () => {
    handleContactPressEnd()
  }

  const handleContactTouchCancel = () => {
    handleContactPressEnd()
  }

  return (
    <Layout>
      <div className="page-container">
        <h1 
          className={`page-title contact-title ${isPressing ? 'contact-growing' : ''}`}
          style={{ transform: `scale(${scale})` }}
          onMouseDown={handleContactMouseDown}
          onMouseUp={handleContactMouseUp}
          onMouseLeave={handleContactMouseLeave}
          onTouchStart={handleContactTouchStart}
          onTouchEnd={handleContactTouchEnd}
          onTouchCancel={handleContactTouchCancel}
          aria-label="Hold to activate easter egg"
          title="Hold to activate easter egg"
        >
          Contact
        </h1>
        <p className="page-content">Get in touch with us and let's build!</p>
        {/* <p className="page-content">Create a audio file for us using <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-link">
          The OR (beta)
        </a>.</p> */}
        <button onClick={handleEmailClick} className="email-button">
          Email Us
        </button>
        <button onClick={handleAudioClick} className="email-button">
          Create Audio With Us (beta)
        </button>
      </div>
    </Layout>
  )
}

export default Contact
