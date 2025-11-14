import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const [isFlipping, setIsFlipping] = useState(false)
  const [isInDragZone, setIsInDragZone] = useState(false)
  const [flipProgress, setFlipProgress] = useState(0) // 0 to 1, represents rotation from 0 to 90 degrees
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const isDraggingRef = useRef(false)
  const touchStartTimeRef = useRef<number | null>(null)
  
  // Detect if device is mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768
  
  // Configuration constants
  const MOBILE_DRAG_ZONE_WIDTH = 100 // Increased from 50px for better detection
  const MOBILE_MAX_SWIPE_DISTANCE = 250 // Reduced from 300px for better sensitivity
  const MOBILE_VERTICAL_TOLERANCE = 100 // Allow up to 100px vertical movement
  const DESKTOP_DRAG_ZONE_SIZE = 120 // Slightly increased for easier access
  const DESKTOP_MAX_DISTANCE = 350 // Reduced for better sensitivity
  const DESKTOP_MIN_ANGLE = 15 // More forgiving angle range (was 30)
  const DESKTOP_MAX_ANGLE = 75 // More forgiving angle range (was 60)
  const MIN_SWIPE_VELOCITY = 0.3 // pixels per ms for quick swipes
  const DESKTOP_MIN_DISTANCE = 20 // Minimum distance to start tracking

  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      toggleTheme()
    } else {
      navigate(path)
    }
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    if (isMobile) {
      // On mobile: check if starting near right edge (within MOBILE_DRAG_ZONE_WIDTH from right)
      const windowWidth = window.innerWidth
      if (clientX > windowWidth - MOBILE_DRAG_ZONE_WIDTH) {
        dragStartRef.current = { x: clientX, y: clientY }
        isDraggingRef.current = true
        touchStartTimeRef.current = Date.now()
      }
    } else {
      // On desktop: check if starting near top-left corner
      if (clientX < DESKTOP_DRAG_ZONE_SIZE && clientY < DESKTOP_DRAG_ZONE_SIZE) {
        dragStartRef.current = { x: clientX, y: clientY }
        isDraggingRef.current = true
        touchStartTimeRef.current = Date.now() // Track time for velocity detection
      }
    }
  }

  const calculateFlipProgress = (clientX: number, clientY: number): number => {
    if (!dragStartRef.current) return 0

    const startX = dragStartRef.current.x
    const startY = dragStartRef.current.y
    
    if (isMobile) {
      // On mobile: horizontal swipe from right to left
      const deltaX = startX - clientX // Positive when swiping right to left
      const deltaY = Math.abs(clientY - startY) // Absolute vertical movement
      
      // Only proceed if horizontal movement is significant and vertical movement is within tolerance
      if (deltaX > 10 && deltaY < MOBILE_VERTICAL_TOLERANCE) {
        // Calculate progress: 0 to 1 based on horizontal distance
        // Use easing for better feel (ease-out cubic)
        const rawProgress = Math.min(deltaX / MOBILE_MAX_SWIPE_DISTANCE, 1)
        // Apply easing: ease-out cubic
        return 1 - Math.pow(1 - rawProgress, 3)
      }
    } else {
      // On desktop: diagonal swipe from top-left to bottom-right
      const deltaX = clientX - startX
      const deltaY = clientY - startY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      
      // Only proceed if we've moved a minimum distance
      if (distance < DESKTOP_MIN_DISTANCE) {
        return 0
      }
      
      // Check if movement is in the right direction (down and right)
      if (deltaX > 0 && deltaY > 0) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
        // More forgiving angle range for diagonal movement
        if (angle >= DESKTOP_MIN_ANGLE && angle <= DESKTOP_MAX_ANGLE) {
          // Calculate progress: 0 to 1 based on distance
          const rawProgress = Math.min(distance / DESKTOP_MAX_DISTANCE, 1)
          // Apply easing: ease-out cubic for smoother feel
          return 1 - Math.pow(1 - rawProgress, 3)
        }
        // Also allow near-horizontal or near-vertical if distance is significant
        // This makes it more forgiving for slightly off-diagonal swipes
        else if (distance > DESKTOP_MAX_DISTANCE * 0.6) {
          // If we've moved far enough, accept it even if angle isn't perfect
          const rawProgress = Math.min(distance / DESKTOP_MAX_DISTANCE, 1)
          // Apply slight penalty for non-ideal angle
          const anglePenalty = 1 - (Math.abs(angle - 45) / 90) * 0.3 // Up to 30% penalty
          return (1 - Math.pow(1 - rawProgress, 3)) * anglePenalty
        }
      }
    }
    
    return 0
  }

  const handleDragEnd = (clientX: number, clientY: number) => {
    if (!dragStartRef.current || !isDraggingRef.current) {
      setFlipProgress(0)
      setIsFlipping(false)
      return
    }

    const progress = calculateFlipProgress(clientX, clientY)
    
    // Check for quick swipe velocity (both mobile and desktop)
    let shouldComplete = progress >= 0.4 // Lowered threshold from 0.5 for better responsiveness
    
    if (touchStartTimeRef.current) {
      const timeElapsed = Date.now() - touchStartTimeRef.current
      const startX = dragStartRef.current.x
      const startY = dragStartRef.current.y
      
      if (isMobile) {
        const deltaX = startX - clientX
        const velocity = deltaX / timeElapsed
        
        // If it's a quick swipe (high velocity), complete even with less progress
        if (velocity > MIN_SWIPE_VELOCITY && deltaX > 50) {
          shouldComplete = true
        }
      } else {
        // Desktop: check velocity of diagonal swipe
        const deltaX = clientX - startX
        const deltaY = clientY - startY
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
        const velocity = distance / timeElapsed
        
        // If it's a quick diagonal swipe, complete even with less progress
        if (velocity > MIN_SWIPE_VELOCITY && distance > 80) {
          shouldComplete = true
        }
      }
    }
    
    if (shouldComplete) {
      // Complete the animation to 90 degrees
      setFlipProgress(1)
      // Wait for the flip animation to complete, then toggle theme
      // This ensures the page is fully flipped before showing the new theme
      setTimeout(() => {
        toggleTheme()
        // Keep the flipped state briefly to show the new theme underneath, then reset
        setTimeout(() => {
          setFlipProgress(0)
          setIsFlipping(false)
        }, 400)
      }, 400)
    } else {
      // Snap back if not enough progress
      setFlipProgress(0)
      setIsFlipping(false)
    }

    dragStartRef.current = null
    isDraggingRef.current = false
    touchStartTimeRef.current = null
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Check if mouse is in the drag zone
    let inZone = false
    if (isMobile) {
      const windowWidth = window.innerWidth
      inZone = e.clientX > windowWidth - MOBILE_DRAG_ZONE_WIDTH
    } else {
      inZone = e.clientX < DESKTOP_DRAG_ZONE_SIZE && e.clientY < DESKTOP_DRAG_ZONE_SIZE
    }
    setIsInDragZone(inZone)
    
    if (isDraggingRef.current && dragStartRef.current) {
      // Update flip progress in real-time
      const progress = calculateFlipProgress(e.clientX, e.clientY)
      if (progress > 0) {
        setIsFlipping(true)
        setFlipProgress(progress)
      } else {
        // On desktop, cancel if moved too far from ideal diagonal
        if (!isMobile) {
          const startX = dragStartRef.current.x
          const startY = dragStartRef.current.y
          const deltaX = e.clientX - startX
          const deltaY = e.clientY - startY
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          
          // Cancel if moved significantly but in wrong direction
          if (distance > 100 && (deltaX <= 0 || deltaY <= 0)) {
            setIsFlipping(false)
            setFlipProgress(0)
            isDraggingRef.current = false
            dragStartRef.current = null
          } else {
            setIsFlipping(false)
            setFlipProgress(0)
          }
        } else {
          setIsFlipping(false)
          setFlipProgress(0)
        }
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    handleDragEnd(e.clientX, e.clientY)
  }

  const handleMouseLeave = () => {
    setIsInDragZone(false)
    if (isDraggingRef.current) {
      // Reset if leaving while dragging
      setFlipProgress(0)
      setIsFlipping(false)
    }
    dragStartRef.current = null
    isDraggingRef.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return
    
    const touch = e.touches[0]
    const windowWidth = window.innerWidth
    // On mobile: check right edge, on desktop: check top-left corner
    const inDragZone = isMobile 
      ? touch.clientX > windowWidth - MOBILE_DRAG_ZONE_WIDTH
      : touch.clientX < DESKTOP_DRAG_ZONE_SIZE && touch.clientY < DESKTOP_DRAG_ZONE_SIZE
    
    if (inDragZone) {
      // Only prevent default if starting in drag zone to avoid interfering with scrolling
      e.preventDefault()
      handleDragStart(touch.clientX, touch.clientY)
    } else {
      // Still track the start position but don't prevent default
      handleDragStart(touch.clientX, touch.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return
    
    const touch = e.touches[0]
    // Check if touch is in the drag zone
    const windowWidth = window.innerWidth
    const inZone = isMobile
      ? touch.clientX > windowWidth - MOBILE_DRAG_ZONE_WIDTH
      : touch.clientX < DESKTOP_DRAG_ZONE_SIZE && touch.clientY < DESKTOP_DRAG_ZONE_SIZE
    setIsInDragZone(inZone)
    
    if (isDraggingRef.current && dragStartRef.current) {
      const startX = dragStartRef.current.x
      const deltaX = startX - touch.clientX
      
      // Only prevent scrolling if we're actually dragging (significant horizontal movement)
      // This allows normal scrolling when not in drag mode
      if (deltaX > 10 || (isMobile && touch.clientX > windowWidth - MOBILE_DRAG_ZONE_WIDTH)) {
        e.preventDefault()
      }
      
      // Update flip progress in real-time
      const progress = calculateFlipProgress(touch.clientX, touch.clientY)
      if (progress > 0) {
        setIsFlipping(true)
        setFlipProgress(progress)
      } else {
        // If we've moved too far from the drag zone, cancel the drag
        if (isMobile && touch.clientX < windowWidth - MOBILE_DRAG_ZONE_WIDTH - 50) {
          setIsFlipping(false)
          setFlipProgress(0)
          isDraggingRef.current = false
          dragStartRef.current = null
        } else {
          setIsFlipping(false)
          setFlipProgress(0)
        }
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsInDragZone(false)
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0]
      handleDragEnd(touch.clientX, touch.clientY)
    } else {
      // Reset if no touch data
      setFlipProgress(0)
      setIsFlipping(false)
    }
  }

  const handleTouchCancel = () => {
    // Handle touch cancellation (e.g., when scrolling starts)
    setIsInDragZone(false)
    if (isDraggingRef.current) {
      setFlipProgress(0)
      setIsFlipping(false)
    }
    dragStartRef.current = null
    isDraggingRef.current = false
    touchStartTimeRef.current = null
  }

  // Calculate rotation angle from progress (0 to 90 degrees)
  const rotationAngle = flipProgress * 90

  return (
    <div 
      className={`layout theme-${theme} ${isFlipping ? 'page-flipping' : ''} ${isInDragZone ? 'drag-zone-active' : ''}`}
      style={{
        '--flip-rotation': `${rotationAngle}deg`,
        '--flip-progress': flipProgress,
      } as React.CSSProperties}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <header className="header">
        {/* Empty header for now */}
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      {location.pathname !== '/contact-me' && (
        <footer className="footer">
          <button onClick={() => handleNavigation('/')} className="footer-button">
            Home
          </button>
          <button onClick={() => handleNavigation('/about')} className="footer-button">
            About
          </button>
          <button onClick={() => {
            // Always use window.location.href to ensure Vercel rewrite works
            // In dev, go to live site; in production, use /go which gets rewritten
            if (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
              // In development, redirect to live site
              window.location.href = 'https://theingredients.io/go'
            } else {
              // In production, use /go which Vercel rewrites to thego-navy.vercel.app
              // Using window.location.href ensures the rewrite happens (React Router navigate won't trigger it)
              window.location.href = '/go'
            }
          }} className="footer-button">
            G.O.
          </button>
          <button onClick={() => handleNavigation('/more')} className="footer-button">
            More
          </button>
        </footer>
      )}
    </div>
  )
}

export default Layout

