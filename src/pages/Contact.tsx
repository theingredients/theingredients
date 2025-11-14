import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import './PageStyles.css'
import './Contact.css'

const Contact = () => {
  const navigate = useNavigate()
  const longPressTimerRef = useRef<number | null>(null)

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients!\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  const handleAudioClick = () => {
    window.open('https://or-six.vercel.app/', '_blank', 'noopener,noreferrer')
  }

  const handleContactPressStart = () => {
    const timer = window.setTimeout(() => {
      navigate('/contact-me')
    }, 500) // 500ms hold duration
    
    longPressTimerRef.current = timer
  }

  const handleContactPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleContactMouseDown = () => {
    handleContactPressStart()
  }

  const handleContactMouseUp = () => {
    handleContactPressEnd()
  }

  const handleContactMouseLeave = () => {
    handleContactPressEnd()
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
          className="page-title contact-title"
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
        <p className="page-content">Get in touch with us.</p>
        {/* <p className="page-content">Create a audio file for us using <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-link">
          The OR (beta)
        </a>.</p> */}
        <button onClick={handleEmailClick} className="email-button">
          Email Us
        </button>
        <button onClick={handleAudioClick} className="email-button">
          Create Audio With Us
        </button>
      </div>
    </Layout>
  )
}

export default Contact
