import { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { isValidExternalUrl } from '../utils/urlValidator'
import './PageStyles.css'
import './Contact.css'

const More = () => {
  const navigate = useNavigate()
  const [isContactPressing, setIsContactPressing] = useState(false)
  const [contactScale, setContactScale] = useState(1)
  const contactAnimationFrameRef = useRef<number | null>(null)
  const contactStartTimeRef = useRef<number | null>(null)
  const isContactPressingRef = useRef<boolean>(false)

  // Calculate the scale needed to fill the screen
  const getMaxScale = (text: string) => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    // Approximate text width at base size (3rem = ~48px)
    const baseTextWidth = text.length * 30 // Approximate width per character
    const baseTextHeight = 60 // Approximate height at 3rem
    
    // Calculate scale needed to fill viewport (with some padding)
    const scaleX = (viewportWidth * 0.9) / baseTextWidth
    const scaleY = (viewportHeight * 0.9) / baseTextHeight
    
    // Use the larger scale to ensure it fills the screen
    return Math.max(scaleX, scaleY) * 1.2 // Add 20% extra to ensure it fills
  }

  // Contact animation
  useEffect(() => {
    if (isContactPressing) {
      // Only set start time if not already set (to avoid overwriting)
      if (!contactStartTimeRef.current) {
        contactStartTimeRef.current = Date.now()
      }
      
      const animate = () => {
        if (!isContactPressingRef.current) {
          return
        }
        
        const elapsed = Date.now() - (contactStartTimeRef.current || 0)
        const maxScale = getMaxScale('Contact')
        
        const duration = 2000
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)
        let newScale = 1 + (maxScale - 1) * easedProgress
        
        // Continue growing slowly after reaching max scale
        if (progress >= 1) {
          const extraTime = elapsed - duration
          const extraScale = (extraTime / 1000) * 0.5 // Slow additional growth
          newScale = maxScale + extraScale
        }
        
        setContactScale(newScale)
        
        // Continue animation as long as still pressing
        if (isContactPressingRef.current) {
          contactAnimationFrameRef.current = requestAnimationFrame(animate)
        }
      }
      
      contactAnimationFrameRef.current = requestAnimationFrame(animate)
    } else {
      if (contactAnimationFrameRef.current) {
        cancelAnimationFrame(contactAnimationFrameRef.current)
        contactAnimationFrameRef.current = null
      }
      setContactScale(1)
      // Don't reset contactStartTimeRef here - we need it in handleContactPressEnd
    }
    
    return () => {
      if (contactAnimationFrameRef.current) {
        cancelAnimationFrame(contactAnimationFrameRef.current)
      }
    }
  }, [isContactPressing])

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients!\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  const handleAudioClick = () => {
    const url = 'https://or-six.vercel.app/'
    // Validate URL before opening to prevent open redirect vulnerabilities
    if (isValidExternalUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      console.warn('External URL blocked:', url)
    }
  }

  // Contact handlers
  const handleContactPressStart = () => {
    isContactPressingRef.current = true
    setIsContactPressing(true)
    contactStartTimeRef.current = Date.now()
  }

  const handleContactPressEnd = () => {
    const wasPressing = isContactPressingRef.current
    const startTime = contactStartTimeRef.current
    
    isContactPressingRef.current = false
    setIsContactPressing(false)
    
    // Only navigate if user held for at least 500ms (easter egg threshold)
    if (wasPressing && startTime) {
      const holdDuration = Date.now() - startTime
      if (holdDuration >= 500) {
        navigate('/contact-me')
      }
    }
    
    contactStartTimeRef.current = null
  }

  const handleContactMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleContactPressStart()
  }

  const handleContactMouseUp = () => {
    handleContactPressEnd()
  }

  const handleContactMouseLeave = (e: React.MouseEvent) => {
    if (e.buttons === 0) {
      handleContactPressEnd()
    }
  }

  const handleContactTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleContactPressStart()
  }

  const handleContactTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while holding, but don't cancel the animation
    // Only prevent if we're actually in the animation state
    if (isContactPressing) {
      e.preventDefault()
    }
  }

  const handleContactTouchEnd = () => {
    handleContactPressEnd()
  }

  const handleContactTouchCancel = () => {
    // Touch cancel fires when the browser cancels the touch (e.g., during scrolling)
    // This is correct behavior - stop the animation
    handleContactPressEnd()
  }

  return (
    <Layout>
      <div className="page-container">
        {/* Timeline Section */}
        <h1 className="page-title contact-title">
          Timeline
        </h1>
        <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="page-content">
          The OR (beta) - audio fun
        </a>
        <p className="page-content">The MIDI (alpha) - MIDI fun</p>
        <p className="page-content">The DO (alpha) - digital organizing</p>
        <p className="page-content">The Future</p>

        {/* Contact Section */}
        <h1 
          className={`page-title contact-title ${isContactPressing ? 'contact-growing' : ''}`}
          style={{ transform: `scale(${contactScale})`, marginTop: '3rem' }}
          onMouseDown={handleContactMouseDown}
          onMouseUp={handleContactMouseUp}
          onMouseLeave={handleContactMouseLeave}
          onTouchStart={handleContactTouchStart}
          onTouchMove={handleContactTouchMove}
          onTouchEnd={handleContactTouchEnd}
          onTouchCancel={handleContactTouchCancel}
          aria-label="Hold to activate easter egg"
          title="Hold to activate easter egg"
        >
          Contact
        </h1>
        <p className="page-content">Get in touch with us and let's build!</p>
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

export default More



