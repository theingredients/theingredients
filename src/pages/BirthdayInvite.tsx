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
    { id: '6', name: 'Cant Go', description: 'but I bought you a coffee', votes: 0, voters: [], link: 'https://www.theingredients.io/coffee' },
  ])
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [isNameModalOpen, setIsNameModalOpen] = useState(false)
  const [pendingRestaurantId, setPendingRestaurantId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [guestCount, setGuestCount] = useState<number>(0)
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

  // Load votes from localStorage on mount
  useEffect(() => {
    const savedRestaurants = localStorage.getItem('birthday-poll-restaurants')
    const savedVote = localStorage.getItem('birthday-poll-user-vote')
    const savedName = localStorage.getItem('birthday-poll-user-name')
    
    if (savedRestaurants) {
      try {
        const restaurantsData = JSON.parse(savedRestaurants)
        setRestaurants(restaurantsData)
      } catch (error) {
        console.error('Error loading restaurants:', error)
      }
    }
    
    // Check if user has already voted
    if (savedName && savedVote) {
      setUserName(savedName)
      setHasVoted(true)
      setSelectedRestaurant(savedVote)
    }
  }, [])

  const handleRestaurantClick = (restaurantId: string) => {
    // Prevent voting if user has already voted
    if (hasVoted) {
      return // User has already voted, don't allow changes
    }
    
    // If user already has a name, allow direct voting
    if (userName) {
      handleVote(restaurantId)
    } else {
      // Show name modal first
      setPendingRestaurantId(restaurantId)
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
    if (pendingRestaurantId) {
      handleVote(pendingRestaurantId, sanitizedName.trim(), guestCount)
      setPendingRestaurantId(null)
    }
    
    // Close modal and clear inputs
    setIsNameModalOpen(false)
    setName('')
    setGuestCount(0)
  }

  const handleVote = (restaurantId: string, nameOverride?: string, guestCountOverride?: number) => {
    // Prevent voting if user has already voted
    if (hasVoted) {
      return
    }
    
    // Use nameOverride if provided, otherwise use userName state
    const nameToUse = nameOverride || userName
    const guests = guestCountOverride !== undefined ? guestCountOverride : guestCount
    const totalPeople = 1 + guests // The voter + their guests
    
    // Require name before voting
    if (!nameToUse) {
      setPendingRestaurantId(restaurantId)
      setIsNameModalOpen(true)
      return
    }
    
    // Record the vote
    setRestaurants(prev => {
      const updated = prev.map(r => {
        if (r.id === restaurantId) {
          // Add the voter's name to the list and increment votes by total people
          // Display format: "Name (+2)" if they have guests, or just "Name" if no guests
          const displayName = guests > 0 ? `${nameToUse} (+${guests})` : nameToUse
          return { 
            ...r, 
            votes: r.votes + totalPeople,
            voters: [...r.voters, displayName]
          }
        }
        return r
      })
      
      // Save restaurants data to localStorage
      localStorage.setItem('birthday-poll-restaurants', JSON.stringify(updated))
      
      return updated
    })
    
    // Mark as voted and save to localStorage
    setHasVoted(true)
    setSelectedRestaurant(restaurantId)
    localStorage.setItem('birthday-poll-user-vote', restaurantId)
  }

  const handleCloseNameModal = () => {
    setIsNameModalOpen(false)
    setPendingRestaurantId(null)
    setName('')
    setNameError(null)
    setGuestCount(0)
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

  // Fireworks easter egg handlers
  const createFirework = (size: number = 1) => {
    const id = fireworkIdCounterRef.current++
    const centerX = 50 // Center of screen
    const centerY = 50
    const particleCount = Math.floor(50 * size)
    
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount
      const distance = 100 * size + Math.random() * 50 * size
      const randomX = Math.cos(angle) * distance
      const randomY = Math.sin(angle) * distance
      
      return {
        id: id * 1000 + i,
        size: size,
        x: centerX,
        y: centerY,
        randomX: randomX / 100,
        randomY: randomY / 100,
      }
    })
    
    setFireworkParticles(prev => [...prev, ...particles])
    
    // Remove particles after animation completes (4 seconds)
    setTimeout(() => {
      setFireworkParticles(prev => prev.filter(p => Math.floor(p.id / 1000) !== id))
    }, 4000)
  }

  const startFireworkCycle = () => {
    setShowFireworks(true)
    createFirework(1)
    
    // Keep creating fireworks while holding
    fireworkIntervalRef.current = setInterval(() => {
      if (isPressingTitleRef.current && pressStartTimeRef.current) {
        const holdDuration = (Date.now() - pressStartTimeRef.current) / 1000
        // Size increases with hold duration: 1x at 1s, 2x at 3s, 3x at 5s, max 4x
        const size = Math.min(1 + (holdDuration - 1) / 2, 4)
        createFirework(size)
      } else {
        if (fireworkIntervalRef.current) {
          clearInterval(fireworkIntervalRef.current)
          fireworkIntervalRef.current = null
        }
      }
    }, 300) // Create new firework every 300ms
    
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
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            Jerome's Birthday Celebration!
          </h1>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>November 21st 2025 - 6:30-7pm start</p>
          <p className={`birthday-subtitle ${isContentExploding ? 'exploding' : ''}`}>This Scorpio has invited you! Help decide where we should go!</p>
          
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
                        {restaurant.link && (
                          <a
                            href={restaurant.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="restaurant-link"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Visit ${restaurant.name} website`}
                          >
                            Visit Website ↗
                          </a>
                        )}
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
                        {/* Display voter names only if user has voted (exclude "Can't Go") */}
                        {hasVoted && !isCantGo && restaurant.voters && restaurant.voters.length > 0 && (
                          <div className="voter-names">
                            {restaurant.voters.map((voter, index) => (
                              <span key={index} className="voter-name">
                                {voter}{index < restaurant.voters.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    
                    {isSelected && (
                      <div className="vote-indicator">✓ Your Vote</div>
                    )}
                    {isWinning && maxVotes > 0 && (
                      <div className="winning-indicator">🏆 Leading</div>
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

