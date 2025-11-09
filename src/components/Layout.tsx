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

  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      toggleTheme()
    } else {
      navigate(path)
    }
  }

  const handleDragStart = (clientX: number, clientY: number) => {
    // Check if starting near top-left corner (within 100px)
    if (clientX < 100 && clientY < 100) {
      dragStartRef.current = { x: clientX, y: clientY }
      isDraggingRef.current = true
    }
  }

  const calculateFlipProgress = (clientX: number, clientY: number): number => {
    if (!dragStartRef.current) return 0

    const startX = dragStartRef.current.x
    const startY = dragStartRef.current.y
    const deltaX = clientX - startX
    const deltaY = clientY - startY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    // Check if diagonal swipe from top-left to bottom-right
    if (deltaX > 0 && deltaY > 0) {
      const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
      // Angle should be between 30-60 degrees for diagonal
      if (angle > 30 && angle < 60) {
        // Calculate progress: 0 to 1 based on distance (max at 400px)
        const maxDistance = 400
        const progress = Math.min(distance / maxDistance, 1)
        return progress
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
    
    // If progress is significant (at least 50%), complete the flip
    if (progress >= 0.5) {
      // Complete the animation
      setFlipProgress(1)
      setTimeout(() => {
        toggleTheme()
        setTimeout(() => {
          setFlipProgress(0)
          setIsFlipping(false)
        }, 100)
      }, 100)
    } else {
      // Snap back if not enough progress
      setFlipProgress(0)
      setIsFlipping(false)
    }

    dragStartRef.current = null
    isDraggingRef.current = false
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Check if mouse is in the drag zone (top-left corner)
    const inZone = e.clientX < 100 && e.clientY < 100
    setIsInDragZone(inZone)
    
    if (isDraggingRef.current && dragStartRef.current) {
      // Update flip progress in real-time
      const progress = calculateFlipProgress(e.clientX, e.clientY)
      if (progress > 0) {
        setIsFlipping(true)
        setFlipProgress(progress)
      } else {
        setIsFlipping(false)
        setFlipProgress(0)
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
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      // Check if touch is in the drag zone (top-left corner)
      const inZone = touch.clientX < 100 && touch.clientY < 100
      setIsInDragZone(inZone)
      
      if (isDraggingRef.current && dragStartRef.current) {
        // Update flip progress in real-time
        const progress = calculateFlipProgress(touch.clientX, touch.clientY)
        if (progress > 0) {
          setIsFlipping(true)
          setFlipProgress(progress)
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
    >
      <header className="header">
        {/* Empty header for now */}
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <button onClick={() => handleNavigation('/')} className="footer-button">
          Home
        </button>
        <button onClick={() => handleNavigation('/about')} className="footer-button">
          About
        </button>
        <button onClick={() => handleNavigation('/contact')} className="footer-button">
          Contact
        </button>
        <button onClick={() => handleNavigation('/more')} className="footer-button">
          More
        </button>
      </footer>
    </div>
  )
}

export default Layout

