import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { sanitizeInput } from '../utils/inputSanitizer'
import './PageStyles.css'
import './BirthdayInvite.css'

interface Restaurant {
  id: string
  name: string
  description?: string
  votes: number
  voters: string[] // Array of voter names
  link?: string
}

const BirthdayInvite = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    { id: '1', name: `Arnoldi's`, description: 'Italian cuisine', votes: 0, voters: [], link: 'https://www.arnoldis.com/' },
    { id: '2', name: 'La Paloma', description: 'Mexican cuisine', votes: 0, voters: [], link: 'https://lapalomasb.com/' },
    { id: '3', name: 'Third Window Brewery', description: 'American', votes: 0, voters: [], link: 'https://www.thirdwindowbrewing.com/' },
    { id: '4', name: 'SB Public Market', description: 'American/Mexican/Japanese/Korean', votes: 0, voters: [], link: 'https://www.sbpublicmarket.com/' },
    { id: '5', name: 'M Special', description: 'American', votes: 0, voters: [], link: 'https://mspecialbrewco.com/' },
    { id: '6', name: 'Cant Go', description: 'Happy Birthday!', votes: 0, voters: [], link: 'https://www.theingredients.io/coffee' },
  ])
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null)
  const [isCantGoVote, setIsCantGoVote] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState<number>(0)
  const [userComment, setUserComment] = useState<string>('')
  const [comments, setComments] = useState<Record<string, string[]>>({})
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [commentSaveSuccess, setCommentSaveSuccess] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [isContentExploding, setIsContentExploding] = useState(false)
  const [fireworkParticles, setFireworkParticles] = useState<Array<{ id: number; size: number; x: number; y: number; randomX: number; randomY: number }>>([])
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

  // Load votes from API and localStorage on mount
  useEffect(() => {
    const loadPollData = async () => {
      try {
        // First, try to load from API (server-side storage)
        const response = await fetch('/api/birthday-poll')
        if (response.ok) {
          const data = await response.json()
          if (data.restaurants && data.restaurants.length > 0) {
            setRestaurants(data.restaurants)
            // Also save to localStorage as backup
            localStorage.setItem('birthday-poll-restaurants', JSON.stringify(data.restaurants))
          }
          // Load comments if available
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
        } else {
          // If API fails, fall back to localStorage
          const savedRestaurants = localStorage.getItem('birthday-poll-restaurants')
          if (savedRestaurants) {
            try {
              const restaurantsData = JSON.parse(savedRestaurants)
              setRestaurants(restaurantsData)
            } catch (error) {
              console.error('Error loading restaurants from localStorage:', error)
            }
          }
        }
      } catch (error) {
        console.error('Error loading poll data from API:', error)
        // Fall back to localStorage
        const savedRestaurants = localStorage.getItem('birthday-poll-restaurants')
        if (savedRestaurants) {
          try {
            const restaurantsData = JSON.parse(savedRestaurants)
            setRestaurants(restaurantsData)
          } catch (err) {
            console.error('Error loading restaurants from localStorage:', err)
          }
        }
      }
    }

    loadPollData()

    // Check if user has already voted (from localStorage)
    const savedVote = localStorage.getItem('birthday-poll-user-vote')
    const savedName = localStorage.getItem('birthday-poll-user-name')
    const savedComments = localStorage.getItem('birthday-poll-comments')
    
    if (savedName && savedVote) {
      setUserName(savedName)
      setHasVoted(true)
      setSelectedRestaurant(savedVote)
    }
    
    // Load saved comments
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
    
    // Also check comments from API response if available
    // This will be handled in the loadPollData function above
  }, [])

  // Clear comment input after successful save
  useEffect(() => {
    if (commentSaveSuccess) {
      // Clear the input after a short delay to show success message
      setTimeout(() => {
        setUserComment('')
      }, 100)
    }
  }, [commentSaveSuccess])

  useEffect(() => {
    // Expose hidden function to view voting data (for admin/debugging)
    // Access via: window.getBirthdayPollData() in browser console
    if (typeof window !== 'undefined') {
      (window as any).getBirthdayPollData = async () => {
        try {
          // Try to fetch from API first
          const response = await fetch('/api/birthday-poll')
          if (response.ok) {
            const data = await response.json()
            console.log('📊 Birthday Poll Voting Data (from API):')
            console.log(JSON.stringify(data, null, 2))
            return data
          }
        } catch (error) {
          console.warn('Failed to fetch from API, trying localStorage:', error)
        }
        
        // Fall back to localStorage
        const restaurantsData = localStorage.getItem('birthday-poll-restaurants')
        if (restaurantsData) {
          try {
            const data = JSON.parse(restaurantsData)
            console.log('📊 Birthday Poll Voting Data (from localStorage):')
            console.log(JSON.stringify(data, null, 2))
            return data
          } catch (error) {
            console.error('Error parsing voting data:', error)
            return null
          }
        } else {
          console.log('No voting data found')
          return null
        }
      }
      
      // Also expose as a simple JSON accessor (async)
      (window as any).birthdayPollData = async () => {
        try {
          const response = await fetch('/api/birthday-poll')
          if (response.ok) {
            return await response.json()
          }
        } catch (error) {
          console.warn('Failed to fetch from API, trying localStorage:', error)
        }
        
        const restaurantsData = localStorage.getItem('birthday-poll-restaurants')
        return restaurantsData ? JSON.parse(restaurantsData) : null
      }
    }
  }, [])

  const handleRestaurantClick = (restaurantId: string) => {
    // Prevent voting if user has already voted
    if (hasVoted) {
      return // User has already voted, don't allow changes
    }
    
    const isCantGo = restaurantId === '6'
    
    // If user already has a name, allow direct voting
    if (userName) {
      handleVote(restaurantId, undefined, isCantGo ? 0 : guestCount)
    } else {
      // Show name modal first
      setPendingRestaurantId(restaurantId)
      setIsCantGoVote(isCantGo)
      setIsNameModalOpen(true)
    }
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const sanitizedName = sanitizeInput(name, 100) // Max name length
    
    if (!sanitizedName || sanitizedName.trim() === '') {
      setNameError('Please enter your name')
      return
    }
    
    // Save name first
    setUserName(sanitizedName.trim())
    localStorage.setItem('birthday-poll-user-name', sanitizedName.trim())
    setNameError(null)
    
    // Process the pending vote with the name passed directly
    // For "Can't Go", always use 0 guests
    if (pendingRestaurantId) {
      const guests = isCantGoVote ? 0 : guestCount
      handleVote(pendingRestaurantId, sanitizedName.trim(), guests)
      setPendingRestaurantId(null)
    }
    
    // Close modal and clear inputs
    setIsNameModalOpen(false)
    setName('')
    setGuestCount(0)
    setIsCantGoVote(false)
  }

  const handleVote = async (restaurantId: string, nameOverride?: string, guestCountOverride?: number) => {
    // Prevent voting if user has already voted
    if (hasVoted) {
      return
    }
    
    // Use nameOverride if provided, otherwise use userName state
    const nameToUse = nameOverride || userName
    const guests = guestCountOverride !== undefined ? guestCountOverride : guestCount
    
    // Require name before voting
    if (!nameToUse) {
      setPendingRestaurantId(restaurantId)
      setIsNameModalOpen(true)
      return
    }
    
    try {
      // Submit vote to API
      const response = await fetch('/api/birthday-poll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantId,
          name: nameToUse,
          guestCount: guests,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 409) {
          // User already voted
          alert(errorData.message || 'You have already voted')
          setHasVoted(true)
          if (errorData.previousVote) {
            setSelectedRestaurant(errorData.previousVote)
          }
          return
        }
        throw new Error(errorData.error || 'Failed to submit vote')
      }

      const result = await response.json()
      
      // Update local state with server response
      if (result.pollData && result.pollData.restaurants) {
        setRestaurants(result.pollData.restaurants)
        // Also save to localStorage as backup
        localStorage.setItem('birthday-poll-restaurants', JSON.stringify(result.pollData.restaurants))
      }
      
      // Update comments if provided
      if (result.comments) {
        setComments(result.comments)
        localStorage.setItem('birthday-poll-comments', JSON.stringify(result.comments))
      }
      
      // Mark as voted and save to localStorage
      setHasVoted(true)
      setSelectedRestaurant(restaurantId)
      localStorage.setItem('birthday-poll-user-vote', restaurantId)
      localStorage.setItem('birthday-poll-user-name', nameToUse)
    } catch (error) {
      console.error('Error submitting vote:', error)
      alert('Failed to submit vote. Please try again.')
      // Optionally fall back to localStorage-only voting
      // For now, we'll just show an error
    }
  }

  const handleCloseNameModal = () => {
    setIsNameModalOpen(false)
    setPendingRestaurantId(null)
    setName('')
    setNameError(null)
    setGuestCount(0)
    setIsCantGoVote(false)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const sanitized = sanitizeInput(rawValue, 100)
    setName(sanitized)
    if (nameError) {
      setNameError(null)
    }
  }

  const handleGuestCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty string, 0, or positive numbers
    if (value === '') {
      setGuestCount(0)
    } else {
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= 0 && num <= 50) {
        setGuestCount(num)
      }
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
    
    // If user hasn't provided a name, show name modal
    if (!userName || !userName.trim()) {
      setIsNameModalOpen(true)
      return
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
          name: userName.trim(),
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
    const baseParticleCount = isMobile ? 12 : 20 // Reduced from 50
    const id = fireworkIdCounterRef.current++
    const centerX = 50 // Center of screen
    const centerY = 50
    // Cap size at 2x for mobile, 3x for desktop (reduced from 4x)
    const cappedSize = isMobile ? Math.min(size, 2) : Math.min(size, 3)
    const particleCount = Math.floor(baseParticleCount * cappedSize)
    
    // Limit total particles to prevent memory issues
    setFireworkParticles(prev => {
      const maxParticles = isMobile ? 60 : 120 // Max total particles
      if (prev.length >= maxParticles) {
        // Remove oldest particles if we're at the limit
        const toRemove = prev.length - maxParticles + particleCount
        return prev.slice(toRemove)
      }
      return prev
    })
    
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount
      const distance = 80 * cappedSize + Math.random() * 40 * cappedSize // Reduced distance
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
    
    // Remove particles after animation completes (reduced to 2.5 seconds)
    setTimeout(() => {
      setFireworkParticles(prev => prev.filter(p => Math.floor(p.id / 1000) !== id))
    }, 2500)
  }

  const startFireworkCycle = () => {
    const isMobile = window.innerWidth <= 768
    setShowFireworks(true)
    createFirework(1)
    
    // Keep creating fireworks while holding (slower interval for mobile)
    const interval = isMobile ? 600 : 400 // Reduced frequency
    fireworkIntervalRef.current = setInterval(() => {
      if (isPressingTitleRef.current && pressStartTimeRef.current) {
        const holdDuration = (Date.now() - pressStartTimeRef.current) / 1000
        // Size increases more slowly: 1x at 1s, 1.5x at 2s, 2x at 3s, max 2.5x for mobile, 3x for desktop
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
    
    // Trigger content explosion after 5 seconds total (4 seconds after initial firework)
    contentExplodeTimerRef.current = setTimeout(() => {
      if (isPressingTitleRef.current) {
        setIsContentExploding(true)
      }
    }, 4000) // 4 seconds after first firework = 5 seconds total from hold start
    
    // Reset everything after 10 seconds total (9 seconds after initial firework)
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
        }, 500) // Small delay before restarting
      }
    }, 9000) // 9 seconds after first firework = 10 seconds total from hold start
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

  // Calculate total votes excluding "Can't Go" option (id: '6')
  const totalVotes = restaurants
    .filter(r => r.id !== '6')
    .reduce((sum, r) => sum + r.votes, 0)
  
  // Calculate max votes excluding "Can't Go" option for winning indicator
  const maxVotes = Math.max(
    ...restaurants
      .filter(r => r.id !== '6')
      .map(r => r.votes),
    0
  )

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
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>This Scorpio has invited you out for dinner! Cast your vote for dinner!</p>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>Pickle Room post dinner!</p>
          
          <div className={`poll-container ${isContentExploding ? 'exploding' : ''}`}>
            <h2 className={`poll-title ${isContentExploding ? 'exploding' : ''}`}>Vote for Your Favorite Restaurant</h2>
            <p className={`poll-description ${isContentExploding ? 'exploding' : ''}`}>
              {hasVoted 
                ? `You voted for: ${restaurants.find(r => r.id === selectedRestaurant)?.name || 'Unknown'}. Thank you for voting, ${userName}!`
                : 'Select your preferred restaurant below'
              }
            </p>
            {hasVoted && (
              <p className={`poll-note ${isContentExploding ? 'exploding' : ''}`}>
                You can only vote once. Your vote has been recorded.
              </p>
            )}
            
            <div className={`restaurants-list ${isContentExploding ? 'exploding' : ''}`}>
              {restaurants.map((restaurant) => {
                // Exclude "Can't Go" from percentage calculations
                const isCantGo = restaurant.id === '6'
                const percentage = !isCantGo && totalVotes > 0 ? (restaurant.votes / totalVotes) * 100 : 0
                const isSelected = selectedRestaurant === restaurant.id
                // "Can't Go" can't be winning
                const isWinning = !isCantGo && restaurant.votes === maxVotes && maxVotes > 0
                
                return (
                  <div
                    key={restaurant.id}
                    className={`restaurant-item ${isSelected ? 'selected' : ''} ${isWinning ? 'winning' : ''} ${hasVoted ? 'disabled' : ''} ${isContentExploding ? 'exploding' : ''}`}
                    onClick={() => !hasVoted && handleRestaurantClick(restaurant.id)}
                    role="button"
                    tabIndex={hasVoted ? -1 : 0}
                    onKeyDown={(e) => {
                      if (hasVoted) return
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleRestaurantClick(restaurant.id)
                      }
                    }}
                    aria-label={hasVoted ? `You already voted for ${restaurant.name}` : `Vote for ${restaurant.name}`}
                    aria-disabled={hasVoted}
                  >
                    <div className="restaurant-info">
                      <div className="restaurant-name-container">
                        <h3 className="restaurant-name">{restaurant.name}</h3>
                      </div>
                      {restaurant.description && (
                        <p className="restaurant-description">{restaurant.description}</p>
                      )}
                    </div>
                    
                    <div className="restaurant-votes">
                      <div className="vote-bar-container">
                        <div 
                          className="vote-bar"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="vote-count">
                        <span className="vote-number">{restaurant.votes}</span>
                        <span className="vote-label">vote{restaurant.votes !== 1 ? 's' : ''}</span>
                        {percentage > 0 && (
                          <span className="vote-percentage">({percentage.toFixed(0)}%)</span>
                        )}
                      </div>
                      {/* Voter names are not displayed - kept for internal tracking only */}
                    </div>
                    
                    {isSelected && (
                      <div className="vote-indicator">✓ Your Vote</div>
                    )}
                    {isWinning && maxVotes > 0 && (
                      <div className="winning-indicator">🏆 Leading</div>
                    )}
                    
                    {restaurant.link && (
                      <a
                        href={restaurant.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="restaurant-link restaurant-link-bottom"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Visit ${restaurant.name} website`}
                      >
                        Visit Website ↗
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
            
            {totalVotes > 0 && (
              <div className={`poll-summary ${isContentExploding ? 'exploding' : ''}`}>
                <p className={`total-votes ${isContentExploding ? 'exploding' : ''}`}>Total Votes: {totalVotes}</p>
              </div>
            )}
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
              Share your thoughts or messages for the birthday celebration! You can add multiple comments. {!userName && 'Please enter your name to comment.'}
            </p>
              
              {/* Success message */}
              {commentSaveSuccess && (
                <div className="comment-success-message">
                  ✓ Comment saved successfully!
                </div>
              )}
              
              {!userName && (
                <div className="comment-name-prompt">
                  <p>Enter your name to add a comment:</p>
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
                        setUserName(name.trim())
                        localStorage.setItem('birthday-poll-user-name', name.trim())
                        setName('')
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
                  placeholder={userName ? "Your comment here..." : "Enter your name above to comment"}
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

      {/* Name Modal */}
      {isNameModalOpen && (
        <div className="email-modal-overlay" onClick={handleCloseNameModal}>
          <div className="email-modal" onClick={(e) => e.stopPropagation()}>
            <div className="email-modal-header">
              <h2 className="email-modal-title">Enter Your Name</h2>
              <button 
                className="email-modal-close"
                onClick={handleCloseNameModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleNameSubmit} className="email-modal-form">
              <p className="email-modal-description">
                Please enter your name to vote
              </p>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Your Name"
                className={`email-input ${nameError ? 'error' : ''}`}
                autoFocus
                required
                maxLength={100}
                aria-label="Your name"
                aria-invalid={nameError ? 'true' : 'false'}
                aria-describedby={nameError ? 'name-error' : undefined}
              />
              {nameError && (
                <p id="name-error" className="email-error-message" role="alert">
                  {nameError}
                </p>
              )}
              {/* Only show guest count for non-"Can't Go" votes */}
              {!isCantGoVote && (
                <div className="email-modal-field">
                  <label htmlFor="guest-count" className="email-modal-label">
                    Number of +1's (guests you're bringing)
                  </label>
                  <input
                    type="number"
                    id="guest-count"
                    value={guestCount || ''}
                    onChange={handleGuestCountChange}
                    placeholder="0"
                    min="0"
                    max="50"
                    className="email-input guest-count-input"
                    aria-label="Number of guests"
                  />
                  <p className="email-modal-hint">
                    Enter 0 if it's just you, or the number of additional people you're bringing
                  </p>
                </div>
              )}
              <div className="email-modal-actions">
                <button 
                  type="button"
                  onClick={handleCloseNameModal}
                  className="email-modal-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="email-modal-submit"
                >
                  Submit & Vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default BirthdayInvite

