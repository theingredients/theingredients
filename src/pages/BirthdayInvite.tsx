import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import { sanitizeInput } from '../utils/inputSanitizer'
import { useTheme } from '../contexts/ThemeContext'
import './PageStyles.css'
import './BirthdayInvite.css'

interface MenuItem {
  name: string
  description?: string
  price: string
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

const BirthdayInvite = () => {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  
  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  
  // Check if user is already authenticated on mount
  useEffect(() => {
    const authToken = sessionStorage.getItem('birthday-invite-auth')
    if (authToken) {
      setIsAuthenticated(true)
    }
  }, [])
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    
    if (!password.trim()) {
      setPasswordError('Please enter a password')
      return
    }
    
    setIsVerifying(true)
    
    try {
      const response = await fetch('/api/verify-birthday-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: password.trim() }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Store authentication token in sessionStorage
        sessionStorage.setItem('birthday-invite-auth', data.token)
        setIsAuthenticated(true)
        setPassword('')
      } else {
        setPasswordError(data.error || 'Incorrect password')
      }
    } catch (error) {
      console.error('Error verifying password:', error)
      setPasswordError('Failed to verify password. Please try again.')
    } finally {
      setIsVerifying(false)
    }
  }
  
  const menuCategories: MenuCategory[] = [
    {
      name: 'Appetizers',
      items: [
        { name: 'Shrimp Gamberi', description: 'Sautéed grilled shrimp served in a spicy white wine tomato sauce', price: '$26.00' },
        { name: 'Calamari Fritti', description: 'Fried wild calamari served with a spicy tomato sauce', price: '$25.00' },
        { name: 'Pane Aglio', description: 'Garlic bread served with our arrabiata dipping sauce', price: '$16.00' },
        { name: 'Arancini', description: 'Fried Italian balls stuffed with mozz cheese served with dipping sauce', price: '$18.00' },
        { name: 'Pizzeta Olive Oil', price: '$18.00' },
        { name: 'Pizzetta Rosemary', description: 'Oval pinsa with rosemary and EVOO', price: '$18.00' },
        { name: 'Flor di Zucca', description: 'Fried zucchini blossoms filled with mascarpone and ricotta cheese served with spicy tomato arrabiatta sauce', price: '$18.00' },
        { name: 'Pizzeta', price: '$18.00' },
        { name: 'Burrata in Carrozza', description: 'Fried breaded burrata cheese in a sun dried tomato and spicy tomato sauce in a small cast iron pan, served with garlic bread', price: '$22.00' },
      ]
    },
    {
      name: 'Secondi Piatti - Meat Entrees',
      items: [
        { name: 'Salmone alla Griglia', description: 'Fresh salmon fillet marinated in herbs drizzled with extra virgin olive oil served with our midnight pasta and spinach', price: '$45.00' },
        { name: 'Tuscan Chicken', description: 'Grilled chicken breast topped with sundried tomato alfredo sauce served with spaghetti in your choice of pomodoro sauce or alfredo sauce', price: '$35.00' },
        { name: 'Milanese de Norte', description: 'Thinly pounded meat, breaded, sautéed, then finished with a drizzle of fresh squeezed lemon juice served with spaghetti pomodoro', price: '$39.00+' },
        { name: 'Chicken Parmesan', description: 'Breaded chicken breast topped with tomato sauce and mozzarella cheese served with spaghetti pomodoro', price: '$36.00' },
        { name: 'Chicken Picatta', description: 'Chicken picatta with linguine alfredo', price: '$33.00+' },
        { name: 'Chicken Marsala', description: 'Sauteed chicken with marsala mushroom sauce, served with linguine alfredo', price: '$36.00' },
      ]
    },
    {
      name: 'Pastas',
      items: [
        { name: 'Spaghetti Carbonara', description: 'Spaghetti with an egg, cream, Pancetta and cheese sauce', price: '$19.00+' },
        { name: 'Penne All\'Arrabbiata', description: 'Quill shaped pasta in a spicy tomato and garlic sauce', price: '$28.00+' },
        { name: 'Lasagne alla Bolognese', description: 'Homemade meat lasagna in a pomodoro sauce', price: '$35.00' },
        { name: 'Spaghetti alle Vongole', description: 'Spaghetti with fresh clams in a choice of white wine or our tomato sauce', price: '$30.00+' },
        { name: 'Spaghetti ai Frutti di Mare', description: 'Spaghetti with fresh assorted seafood in a light spicy tomato sauce', price: '$24.00+' },
        { name: 'Pasta al Pomodoro', description: 'Your choice of pasta in our traditional fresh tomato and basil sauce', price: '$26.00+' },
        { name: 'Linguine Primavera', description: 'Fresh seasoned vegetables, garlic extra virgin olive oil and fresh herbs', price: '$31.00+' },
        { name: 'Rotolo di Ricotta e Spinaci', description: 'Housemade pasta filled with ricotta and spinach in a spinach sauce', price: '$30.00' },
        { name: 'Spaghetti alla Bolognese', description: 'Spaghetti with housemade meatballs in a ragù sauce', price: '$32.00+' },
        { name: 'Penne Filanti al Quattro Formaggi', description: 'Quill shaped pasta in a cream sauce with Parmesan, Mozzarella and Pecorino cheese, prosciutto cotto and walnuts', price: '$32.00+' },
        { name: 'Linguine al Pesto', description: 'Pasta in a traditional Genovese basil and pine nut pesto sauce', price: '$18.00+' },
        { name: 'Gnocchi Tricolore', description: 'Traditional housemade potato dumplings in a Pomodoro, Gorgonzola and Pesto sauce', price: '$35.00+' },
        { name: 'Ravioli Di Carne', description: 'Short rib ravioli in a gorgonzola cream sauce', price: '$35.00' },
        { name: 'Pasta al Pomodoro (1)', description: 'Your choice of pasta in our traditional fresh tomato and basil sauce', price: '$28.00' },
        { name: 'Pinsa EVOO/Rosemary Garlic Sauce', price: '$18.00' },
        { name: 'Pinsa Pesto Sauce', price: '$18.00' },
        { name: 'Pinsa White Sauce and Onions', price: '$18.00' },
      ]
    },
    {
      name: 'Desserts',
      items: [
        { name: 'Coffee Tiramisu', description: 'Traditional Coffee Tiramisu', price: '$14.00' },
        { name: 'Chocolate Mousse', price: '$12.00' },
        { name: 'Passion Fruit Sorbet', price: '$12.00' },
        { name: 'Gelato', description: 'Vanilla bean gelato with a choice of chocolate or strawberry sauce', price: '$12.00' },
        { name: 'Vanilla Gelato with Strawberry', price: '$12.00' },
        { name: 'Cannoli', description: 'Fresh stuffed mini cannoli shells', price: '$14.00' },
        { name: 'Cheesecake Monterosa', description: 'Creamy mix of mascarpone and ricotta cheese, divided by a delicate layer of sponge cake, topped with wild strawberries', price: '$14.00' },
        { name: 'Gluten Free Rosso Velvet', description: 'Alternating layers of gluten free red heid mini chocolate sponge cake, and cream cheese icing topped with gluten free crumbs', price: '$12.00' },
        { name: 'Limoncello Truffle', description: 'Lemon gelato ball with limoncello in the center', price: '$12.00' },
        { name: 'Cappucino Gelato Ball', description: 'Italian coffee gelato with espresso core', price: '$8.00' },
        { name: 'Lemon Blueberry Crumb Cheesecake', price: '$14.00' },
      ]
    },
    {
      name: 'Beverages',
      items: [
        { name: 'Shirley Temple', price: '$4.00' },
        { name: 'Roy Roger', price: '$4.00' },
        { name: 'Soda', price: '$4.00' },
        { name: 'Coffee Regular', price: '$4.00' },
      ]
    },
  ]
  
  const [userName, setUserName] = useState<string | null>(null)
  const [userComment, setUserComment] = useState<string>('')
  const [comments, setComments] = useState<Record<string, string[]>>({})
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [commentSaveSuccess, setCommentSaveSuccess] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [showFireworks, setShowFireworks] = useState(false)
  const [isContentExploding, setIsContentExploding] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [fireworkParticles, setFireworkParticles] = useState<Array<{ id: number; size: number; x: number; y: number; randomX: number; randomY: number }>>([])
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const titlePressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fireworkIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const contentExplodeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isPressingTitleRef = useRef<boolean>(false)
  const pressStartTimeRef = useRef<number | null>(null)
  const fireworkIdCounterRef = useRef<number>(0)

  // Set page title when component mounts
  useEffect(() => {
    const originalTitle = document.title
    document.title = "Jerome's 39th Birthday Celebration - The Ingredients"
    
    // Restore original title when component unmounts
    return () => {
      document.title = originalTitle
    }
  }, [])

  // Load comments from API and localStorage on mount
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch('/api/birthday-poll')
        if (response.ok) {
          const data = await response.json()
          if (data.comments) {
            // Migrate old format to new format if needed
            const migratedComments: Record<string, string[]> = {}
            for (const [name, comment] of Object.entries(data.comments)) {
              if (typeof comment === 'string') {
                migratedComments[name] = comment.trim() ? [comment] : []
              } else if (Array.isArray(comment)) {
                migratedComments[name] = comment.filter((c: string) => c && c.trim())
              }
            }
            setComments(migratedComments)
            localStorage.setItem('birthday-poll-comments', JSON.stringify(migratedComments))
          }
        }
      } catch (error) {
        console.error('Error loading comments from API:', error)
      }
    }

    loadComments()

    // Check if user has already provided a name
    const savedName = localStorage.getItem('birthday-poll-user-name')
    if (savedName) {
      setUserName(savedName)
    }
    
    // Load saved comments from localStorage
    const savedComments = localStorage.getItem('birthday-poll-comments')
    if (savedComments) {
      try {
        const commentsData = JSON.parse(savedComments)
        // Migrate old format to new format if needed
        const migratedComments: Record<string, string[]> = {}
        for (const [name, comment] of Object.entries(commentsData)) {
          if (typeof comment === 'string') {
            migratedComments[name] = comment.trim() ? [comment] : []
          } else if (Array.isArray(comment)) {
            migratedComments[name] = comment.filter((c: string) => c && c.trim())
          }
        }
        setComments(migratedComments)
      } catch (error) {
        console.error('Error loading comments from localStorage:', error)
      }
    }
  }, [])

  // Clear comment input after successful save
  useEffect(() => {
    if (commentSaveSuccess) {
      setTimeout(() => {
        setUserComment('')
      }, 100)
    }
  }, [commentSaveSuccess])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const sanitized = sanitizeInput(rawValue, 100)
    setName(sanitized)
    if (nameError) {
      setNameError(null)
    }
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    // Limit to 500 characters
    if (value.length <= 500) {
      setUserComment(value)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // If user hasn't provided a name, show name prompt
    if (!userName || !userName.trim()) {
      if (!name.trim()) {
        setNameError('Please enter your name to comment')
        return
      }
      const sanitizedName = sanitizeInput(name, 100).trim()
      if (sanitizedName) {
        setUserName(sanitizedName)
        localStorage.setItem('birthday-poll-user-name', sanitizedName)
        setName('')
        setNameError(null)
      } else {
        setNameError('Please enter your name')
        return
      }
    }

    // Validate comment
    if (!userComment || !userComment.trim()) {
      alert('Please enter a comment')
      return
    }

    setIsSavingComment(true)
    
    try {
      const response = await fetch('/api/birthday-poll', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userName!.trim(),
          comment: userComment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save comment')
      }

      const result = await response.json()
      
      // Update comments state
      if (result.comments) {
        // Migrate old format to new format if needed
        const migratedComments: Record<string, string[]> = {}
        for (const [name, comment] of Object.entries(result.comments)) {
          if (typeof comment === 'string') {
            migratedComments[name] = comment.trim() ? [comment] : []
          } else if (Array.isArray(comment)) {
            migratedComments[name] = comment.filter((c: string) => c && c.trim())
          }
        }
        setComments(migratedComments)
        localStorage.setItem('birthday-poll-comments', JSON.stringify(migratedComments))
      }
      
      // Clear input and show success message
      setUserComment('')
      setCommentSaveSuccess(true)
      setTimeout(() => {
        setCommentSaveSuccess(false)
      }, 3000) // Hide after 3 seconds
    } catch (error) {
      console.error('Error saving comment:', error)
      alert('Failed to save comment. Please try again.')
    } finally {
      setIsSavingComment(false)
    }
  }

  // Fireworks easter egg handlers
  const createFirework = (size: number = 1) => {
    // Detect mobile for reduced particle count
    const isMobile = window.innerWidth <= 768
    const baseParticleCount = isMobile ? 12 : 20
    const id = fireworkIdCounterRef.current++
    const centerX = 50 // Center of screen
    const centerY = 50
    // Cap size at 2x for mobile, 3x for desktop
    const cappedSize = isMobile ? Math.min(size, 2) : Math.min(size, 3)
    const particleCount = Math.floor(baseParticleCount * cappedSize)
    
    // Limit total particles to prevent memory issues
    setFireworkParticles(prev => {
      const maxParticles = isMobile ? 60 : 120
      if (prev.length >= maxParticles) {
        // Remove oldest particles if we're at the limit
        const toRemove = prev.length - maxParticles + particleCount
        return prev.slice(toRemove)
      }
      return prev
    })
    
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount
      const distance = 80 * cappedSize + Math.random() * 40 * cappedSize
      const randomX = Math.cos(angle) * distance
      const randomY = Math.sin(angle) * distance
      
      return {
        id: id * 1000 + i,
        size: cappedSize,
        x: centerX,
        y: centerY,
        randomX: randomX / 100,
        randomY: randomY / 100,
      }
    })
    
    setFireworkParticles(prev => [...prev, ...particles])
    
    // Remove particles after animation completes
    setTimeout(() => {
      setFireworkParticles(prev => prev.filter(p => Math.floor(p.id / 1000) !== id))
    }, 2500)
  }

  const startFireworkCycle = () => {
    const isMobile = window.innerWidth <= 768
    setShowFireworks(true)
    createFirework(1)
    
    // Keep creating fireworks while holding
    const interval = isMobile ? 600 : 400
    fireworkIntervalRef.current = setInterval(() => {
      if (isPressingTitleRef.current && pressStartTimeRef.current) {
        const holdDuration = (Date.now() - pressStartTimeRef.current) / 1000
        const maxSize = isMobile ? 2.5 : 3
        const size = Math.min(1 + (holdDuration - 1) / 2, maxSize)
        createFirework(size)
      } else {
        if (fireworkIntervalRef.current) {
          clearInterval(fireworkIntervalRef.current)
          fireworkIntervalRef.current = null
        }
      }
    }, interval)
    
    // Trigger content explosion after 5 seconds total
    contentExplodeTimerRef.current = setTimeout(() => {
      if (isPressingTitleRef.current) {
        setIsContentExploding(true)
      }
    }, 4000)
    
    // Reset everything after 10 seconds total
    resetTimerRef.current = setTimeout(() => {
      if (isPressingTitleRef.current) {
        // Reset all effects
        setIsContentExploding(false)
        setShowFireworks(false)
        setFireworkParticles([])
        
        // Clear intervals and timers
        if (fireworkIntervalRef.current) {
          clearInterval(fireworkIntervalRef.current)
          fireworkIntervalRef.current = null
        }
        if (contentExplodeTimerRef.current) {
          clearTimeout(contentExplodeTimerRef.current)
          contentExplodeTimerRef.current = null
        }
        
        // Reset press start time to restart the cycle
        pressStartTimeRef.current = Date.now()
        
        // Restart the cycle after a brief pause
        setTimeout(() => {
          if (isPressingTitleRef.current) {
            startFireworkCycle()
          }
        }, 500)
      }
    }, 9000)
  }

  const handleTitlePressStart = () => {
    isPressingTitleRef.current = true
    pressStartTimeRef.current = Date.now()
    
    const timer = setTimeout(() => {
      if (isPressingTitleRef.current) {
        startFireworkCycle()
      }
    }, 1000) // 1 second hold duration before starting
    titlePressTimerRef.current = timer
  }

  const handleTitlePressEnd = () => {
    isPressingTitleRef.current = false
    pressStartTimeRef.current = null
    
    if (titlePressTimerRef.current) {
      clearTimeout(titlePressTimerRef.current)
      titlePressTimerRef.current = null
    }
    
    if (fireworkIntervalRef.current) {
      clearInterval(fireworkIntervalRef.current)
      fireworkIntervalRef.current = null
    }
    
    if (contentExplodeTimerRef.current) {
      clearTimeout(contentExplodeTimerRef.current)
      contentExplodeTimerRef.current = null
    }
    
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
    
    // Reset content explosion after a delay
    setTimeout(() => {
      if (!isPressingTitleRef.current) {
        setIsContentExploding(false)
        setShowFireworks(false)
        setFireworkParticles([])
      }
    }, 4000)
  }

  const handleTitleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleTitlePressStart()
  }

  const handleTitleMouseUp = () => {
    handleTitlePressEnd()
  }

  const handleTitleMouseLeave = (e: React.MouseEvent) => {
    if (e.buttons === 0) {
      handleTitlePressEnd()
    }
  }

  const handleTitleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleTitlePressStart()
  }

  const handleTitleTouchEnd = () => {
    handleTitlePressEnd()
  }

  const handleTitleTouchCancel = () => {
    handleTitlePressEnd()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (titlePressTimerRef.current) {
        clearTimeout(titlePressTimerRef.current)
      }
      if (fireworkIntervalRef.current) {
        clearInterval(fireworkIntervalRef.current)
      }
      if (contentExplodeTimerRef.current) {
        clearTimeout(contentExplodeTimerRef.current)
      }
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="page-container">
          <div className="password-protection-container">
            <div className="password-protection-form">
              <h2 className="password-protection-title">Birthday Invite</h2>
              <p className="password-protection-description">Please enter the password to access this page</p>
              <form onSubmit={handlePasswordSubmit} className="password-form">
                <div className="password-form-group">
                  <label htmlFor="password-input" className="password-label">
                    Password
                  </label>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`password-input ${passwordError ? 'error' : ''}`}
                    placeholder="Enter password"
                    autoFocus
                    disabled={isVerifying}
                    aria-label="Password"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                  />
                  {passwordError && (
                    <p id="password-error" className="password-error" role="alert">
                      {passwordError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="password-submit-button"
                  disabled={isVerifying || !password.trim()}
                >
                  {isVerifying ? 'Verifying...' : 'Enter'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-container">
        <div className={`birthday-invite ${isContentExploding ? 'content-exploding' : ''}`}>
          <h1 
            className={`page-title birthday-title-interactive ${isContentExploding ? 'exploding' : ''}`}
            onMouseDown={handleTitleMouseDown}
            onMouseUp={handleTitleMouseUp}
            onMouseLeave={handleTitleMouseLeave}
            onTouchStart={handleTitleTouchStart}
            onTouchEnd={handleTitleTouchEnd}
            onTouchCancel={handleTitleTouchCancel}
            style={{ 
              cursor: 'pointer', 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              WebkitTouchCallout: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            Jerome's 39th Birthday Celebration!
          </h1>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>November 21st 2025 - 7:30pm reservation time set</p>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>Join us at Arnoldi's for dinner!</p>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>Downtown/Pickle Room post dinner</p>

          
          {/* Menu Section */}
          <div className={`menu-container ${isContentExploding ? 'exploding' : ''}`}>
            <h2 
              className={`menu-title menu-title-toggle ${isContentExploding ? 'exploding' : ''}`}
              onClick={toggleTheme}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleTheme()
                }
              }}
              aria-label="Toggle light/dark mode"
              title="Click to toggle light/dark mode"
            >
              Arnoldi's Menu
            </h2>
            <p className={`menu-description ${isContentExploding ? 'exploding' : ''}`}>
              Find what you'd enjoy eating!
            </p>
            
            {menuCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.name)
              return (
              <div key={category.name} className={`menu-category ${isContentExploding ? 'exploding' : ''}`}>
                  <div 
                    className={`category-header ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => {
                      const newExpanded = new Set(expandedCategories)
                      if (isExpanded) {
                        newExpanded.delete(category.name)
                      } else {
                        newExpanded.add(category.name)
                      }
                      setExpandedCategories(newExpanded)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        const newExpanded = new Set(expandedCategories)
                        if (isExpanded) {
                          newExpanded.delete(category.name)
                        } else {
                          newExpanded.add(category.name)
                        }
                        setExpandedCategories(newExpanded)
                      }
                    }}
                    aria-expanded={isExpanded}
                    aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name} menu`}
                  >
                <h3 className={`category-title ${isContentExploding ? 'exploding' : ''}`}>{category.name}</h3>
                    <span className="category-toggle-icon" aria-hidden="true">
                      <Icon name={isExpanded ? 'chevron-down' : 'chevron-right'} size={16} />
                    </span>
                  </div>
                  {isExpanded && (
                <div className="menu-items-list">
                  {category.items.map((item, index) => (
                    <div key={`${category.name}-${index}`} className={`menu-item ${isContentExploding ? 'exploding' : ''}`}>
                      <div className="menu-item-header">
                        <h4 className="menu-item-name">{item.name}</h4>
                        <span className="menu-item-price">{item.price}</span>
                      </div>
                      {item.description && (
                        <p className="menu-item-description">{item.description}</p>
                      )}
                    </div>
                  ))}
                </div>
                  )}
              </div>
              )
            })}
            
            <div className={`menu-footer ${isContentExploding ? 'exploding' : ''}`}>
              <p>
                <a 
                  href="https://www.arnoldis.com/popmenu-order/arnoldis-cafe/menus/menu-online-ordering" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="menu-link"
                >
                  View Full Menu & Order Online ↗
                </a>
              </p>
            </div>
                      </div>

          {/* Help Pay Bill Button */}
          <div className={`help-pay-bill-section ${isContentExploding ? 'exploding' : ''}`}>
            <button
              className="help-pay-bill-button"
              onClick={() => setIsPaymentModalOpen(true)}
              aria-label="Help pay the bill"
            >
              Help Pay Bill
            </button>
          </div>

          {/* All Comments Section - Show all comments from all users */}
          <div className={`all-comments-section ${isContentExploding ? 'exploding' : ''}`}>
            <h3 className={`all-comments-title ${isContentExploding ? 'exploding' : ''}`}>
              Messages from Everyone ({Object.values(comments).flat().length})
            </h3>
            {Object.values(comments).flat().length > 0 ? (
              <div className="all-comments-list">
                {Object.entries(comments)
                  .flatMap(([name, commentArray]) => 
                    commentArray.map((comment, index) => ({ name, comment, index }))
                  )
                  .map(({ name, comment, index }) => (
                    <div key={`${name}-${index}`} className={`comment-item ${name === userName ? 'current-user-comment' : ''}`}>
                      <div className="comment-item-header">
                        <span className="comment-author">{name}</span>
                        {name === userName && (
                          <span className="comment-badge">You</span>
                        )}
                      </div>
                      <div className="comment-item-text">{comment}</div>
                    </div>
                  ))}
                  </div>
            ) : (
              <div className="no-comments-message">
                <p>No messages yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>

          {/* Comment Section - Available to everyone */}
            <div className={`comment-section ${isContentExploding ? 'exploding' : ''}`}>
              <h3 className={`comment-section-title ${isContentExploding ? 'exploding' : ''}`}>
              Add a Comment
              </h3>
              <p className={`comment-section-description ${isContentExploding ? 'exploding' : ''}`}>
              Share some thoughts and feelings!
            </p>
              
            {/* Success message */}
            {commentSaveSuccess && (
              <div className="comment-success-message">
                ✓ Comment saved successfully!
              </div>
            )}
              
            {!userName && (
              <div className="comment-name-prompt">
                <p>Who are you?</p>
                <input
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Your Name"
                  className={`email-input ${nameError ? 'error' : ''}`}
                  maxLength={100}
                  aria-label="Your name"
                  aria-invalid={nameError ? 'true' : 'false'}
                  aria-describedby={nameError ? 'name-error' : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && name.trim()) {
                      const sanitizedName = sanitizeInput(name, 100).trim()
                      if (sanitizedName) {
                        setUserName(sanitizedName)
                        localStorage.setItem('birthday-poll-user-name', sanitizedName)
                        setName('')
                        setNameError(null)
                      } else {
                        setNameError('Please enter your name')
                      }
                    }
                  }}
                />
                {nameError && (
                  <p id="name-error" className="email-error-message" role="alert">
                    {nameError}
                  </p>
                )}
                {name.trim() && (
                  <button
                    type="button"
                    className="comment-submit-button"
                    onClick={() => {
                      const sanitizedName = sanitizeInput(name, 100).trim()
                      if (sanitizedName) {
                        setUserName(sanitizedName)
                        localStorage.setItem('birthday-poll-user-name', sanitizedName)
                        setName('')
                        setNameError(null)
                      } else {
                        setNameError('Please enter your name')
                      }
                    }}
                  >
                    Use This Name
                  </button>
                )}
              </div>
            )}
              
            {userName && (
              <div className="comment-user-info">
                <span className="comment-user-name">Commenting as: <strong>{userName}</strong></span>
                <button
                  type="button"
                  className="comment-change-name-button"
                  onClick={() => {
                    setUserName(null)
                    localStorage.removeItem('birthday-poll-user-name')
                    setName('')
                  }}
                >
                  Change Name
                </button>
              </div>
            )}
              
              <form onSubmit={handleCommentSubmit} className="comment-form">
                <textarea
                  value={userComment}
                  onChange={handleCommentChange}
                placeholder={userName ? "Your comment here..." : "Enter your name first!"}
                  className="comment-textarea"
                  rows={4}
                  maxLength={500}
                  aria-label="Comment"
                disabled={!userName}
                />
                <div className="comment-footer">
                  <span className="comment-character-count">
                    {userComment.length}/500 characters
                  </span>
                  <button
                    type="submit"
                    className="comment-submit-button"
                  disabled={isSavingComment || !userName || !userComment.trim()}
                  >
                  {isSavingComment ? 'Saving...' : 'Add Comment'}
                  </button>
                </div>
              </form>
            </div>

          {/* Game Button */}
          <div className={`game-button-section ${isContentExploding ? 'exploding' : ''}`}>
            <button
              type="button"
              className="game-button"
              onClick={() => {
                navigate('/bdaygame')
              }}
            >
              Let's Play A Game
            </button>
          </div>
        </div>
      </div>

      {/* Fireworks */}
      {showFireworks && (
        <div className="fireworks-container">
          {fireworkParticles.map((particle) => (
            <div 
              key={particle.id} 
              className="firework" 
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                '--random-x': particle.randomX,
                '--random-y': particle.randomY,
                '--particle-size': particle.size,
              } as React.CSSProperties & { 
                '--random-x': number; 
                '--random-y': number;
                '--particle-size': number;
              }}
            />
          ))}
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="payment-modal-overlay" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h2 className="payment-modal-title">Thank You For Coming!</h2>
              <button
                className="payment-modal-close"
                onClick={() => setIsPaymentModalOpen(false)}
                aria-label="Close payment modal"
              >
                <Icon name="x" size={24} ariaHidden={true} />
              </button>
            </div>
            <div className="payment-modal-content">
              <p className="payment-modal-description">
                I very much appreciate you coming and celebrating my 39th birthday! There's nothing better than having family and friends to celebrate. I made this to help pay the bill for the night. I hope this works!
              </p>
              
              {/* Venmo Section */}
              <div className="payment-option">
                <h3 className="payment-option-title">Venmo</h3>
                <p className="payment-option-description">Send payment via Venmo</p>
                <div className="payment-qr-container">
                  <QRCodeSVG
                    value="https://venmo.com/u/Agustinjd"
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <a
                  href="https://venmo.com/u/Agustinjd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payment-link-button venmo-button"
                >
                  Open Venmo ↗
                </a>
                <p className="payment-username">@Agustinjd</p>
              </div>

              {/* Zelle Section */}
              <div className="payment-option">
                <h3 className="payment-option-title">Zelle®</h3>
                <p className="payment-option-description">Scan QR code in your banking app to pay</p>
                <div className="payment-qr-container">
                  <QRCodeSVG
                    value="zelle://send?recipient=jerome.agustin@example.com&amount="
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#000000"
                    bgColor="#ffffff"
                  />
                </div>
                <a
                  href="https://www.zelle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="payment-link-button zelle-button"
                >
                  Open Zelle ↗
                </a>
                <p className="payment-username">Jerome Agustin</p>
                <p className="payment-note">Scan with your banking app that supports Zelle</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default BirthdayInvite
