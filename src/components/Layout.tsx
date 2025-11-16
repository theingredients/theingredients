import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import Search from './Search'
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
  
  // Question mark gesture easter egg state
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isDrawingRef = useRef(false)
  const drawingPointsRef = useRef<Array<{ x: number; y: number; time: number }>>([])
  const questionMarkStartTimeRef = useRef<number | null>(null)
  
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
    // Only handle if not clicking on interactive elements
    const target = e.target as HTMLElement
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('button') || target.closest('a')) {
      return
    }
    
    // Check if this is for page flip or question mark detection
    // If in drag zone, use page flip; otherwise, start question mark detection
    const inDragZone = isMobile 
      ? e.clientX > window.innerWidth - MOBILE_DRAG_ZONE_WIDTH
      : e.clientX < DESKTOP_DRAG_ZONE_SIZE && e.clientY < DESKTOP_DRAG_ZONE_SIZE
    
    if (inDragZone) {
      handleDragStart(e.clientX, e.clientY)
    } else {
      startQuestionMarkDetection(e.clientX, e.clientY)
    }
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
    } else if (isDrawingRef.current) {
      addDrawingPoint(e.clientX, e.clientY)
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      handleDragEnd(e.clientX, e.clientY)
    } else if (isDrawingRef.current) {
      // Final check for question mark on mouse up
      if (drawingPointsRef.current.length >= 10 && detectQuestionMark(drawingPointsRef.current)) {
        setIsSearchOpen(true)
      }
      stopQuestionMarkDetection()
    }
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
    stopQuestionMarkDetection()
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
      // Start question mark detection
      startQuestionMarkDetection(touch.clientX, touch.clientY)
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
    } else if (isDrawingRef.current) {
      addDrawingPoint(touch.clientX, touch.clientY)
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsInDragZone(false)
    if (isDraggingRef.current) {
      if (e.changedTouches.length > 0) {
        const touch = e.changedTouches[0]
        handleDragEnd(touch.clientX, touch.clientY)
      } else {
        // Reset if no touch data
        setFlipProgress(0)
        setIsFlipping(false)
      }
    } else if (isDrawingRef.current) {
      // Final check for question mark on touch end
      if (drawingPointsRef.current.length >= 10 && detectQuestionMark(drawingPointsRef.current)) {
        setIsSearchOpen(true)
      }
      stopQuestionMarkDetection()
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
    stopQuestionMarkDetection()
  }

  // Calculate rotation angle from progress (0 to 90 degrees)
  // On mobile (right-to-left swipe), use negative rotation so page comes towards user (like a book)
  const rotationAngle = isMobile ? flipProgress * -90 : flipProgress * 90

  // Question mark gesture detection
  // Detects when user draws a question mark pattern anywhere on the app
  
  const detectQuestionMark = (points: Array<{ x: number; y: number; time: number }>): boolean => {
    if (points.length < 10) return false // Need minimum points for pattern
    
    // Normalize points to start at origin for easier analysis
    const startX = points[0].x
    const startY = points[0].y
    const normalized = points.map(p => ({
      x: p.x - startX,
      y: p.y - startY,
      time: p.time
    }))
    
    // Find bounding box
    const minX = Math.min(...normalized.map(p => p.x))
    const maxX = Math.max(...normalized.map(p => p.x))
    const minY = Math.min(...normalized.map(p => p.y))
    const maxY = Math.max(...normalized.map(p => p.y))
    const width = maxX - minX
    const height = maxY - minY
    
    // Question mark should have reasonable aspect ratio (taller than wide)
    if (height < width * 0.8 || height < 50) return false
    
    // Check for question mark characteristics:
    // 1. Starts at top (or near top)
    // 2. Goes down (vertical line or curve)
    // 3. Has a hook/curve at bottom going up and around
    // 4. Ends near top (dot)
    
    const startPoint = normalized[0]
    const endPoint = normalized[normalized.length - 1]
    const midPoint = normalized[Math.floor(normalized.length / 2)]
    
    // Start should be near top of bounding box
    const startYRatio = (startPoint.y - minY) / height
    if (startYRatio > 0.3) return false // Start too low
    
    // End should be near top (dot)
    const endYRatio = (endPoint.y - minY) / height
    if (endYRatio > 0.4) return false // End too low
    
    // Middle should be near bottom (hook part)
    const midYRatio = (midPoint.y - minY) / height
    if (midYRatio < 0.5) return false // Middle too high
    
    // Check for vertical movement (going down then up)
    let goingDown = false
    let goingUp = false
    let reachedBottom = false
    
    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1]
      const curr = normalized[i]
      const yDiff = curr.y - prev.y
      const yRatio = (curr.y - minY) / height
      
      if (yDiff > 2 && !reachedBottom) {
        goingDown = true
      }
      if (yRatio > 0.7) {
        reachedBottom = true
      }
      if (yDiff < -2 && reachedBottom) {
        goingUp = true
      }
    }
    
    // Must have gone down, reached bottom, then gone up
    if (!goingDown || !reachedBottom || !goingUp) return false
    
    // Check for horizontal movement (hook/curve)
    const horizontalRange = maxX - minX
    if (horizontalRange < width * 0.2) return false // Need some horizontal movement for hook
    
    // Check if path curves back (question mark hook)
    const firstHalf = normalized.slice(0, Math.floor(normalized.length / 2))
    const secondHalf = normalized.slice(Math.floor(normalized.length / 2))
    
    const firstHalfMaxX = Math.max(...firstHalf.map(p => p.x))
    const secondHalfMinX = Math.min(...secondHalf.map(p => p.x))
    
    // Second half should curve back (x decreases or stays similar)
    // This indicates the hook of the question mark
    if (secondHalfMinX > firstHalfMaxX * 0.8) return false
    
    return true
  }

  const startQuestionMarkDetection = (clientX: number, clientY: number) => {
    isDrawingRef.current = true
    questionMarkStartTimeRef.current = Date.now()
    drawingPointsRef.current = [{ x: clientX, y: clientY, time: Date.now() }]
  }

  const addDrawingPoint = (clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return
    
    drawingPointsRef.current.push({ x: clientX, y: clientY, time: Date.now() })
    
    // Limit points array size to prevent memory issues
    if (drawingPointsRef.current.length > 200) {
      drawingPointsRef.current.shift()
    }
    
    // Check for question mark pattern periodically
    if (drawingPointsRef.current.length >= 10 && drawingPointsRef.current.length % 5 === 0) {
      if (detectQuestionMark(drawingPointsRef.current)) {
        setIsSearchOpen(true)
        stopQuestionMarkDetection()
      }
    }
  }

  const stopQuestionMarkDetection = () => {
    isDrawingRef.current = false
    questionMarkStartTimeRef.current = null
    drawingPointsRef.current = []
  }

  const handleCloseSearch = () => {
    setIsSearchOpen(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopQuestionMarkDetection()
    }
  }, [])

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
          <button 
            onClick={() => handleNavigation('/coffee')} 
            className="footer-button footer-button-icon" 
            aria-label="Coffee"
          >
            ☕
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

      {/* Search Modal (Coffee Button Easter Egg) */}
      <Search isOpen={isSearchOpen} onClose={handleCloseSearch} />
    </div>
  )
}

export default Layout

