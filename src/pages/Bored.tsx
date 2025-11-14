import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { apiRateLimiter } from '../utils/rateLimiter'
import './PageStyles.css'
import './Bored.css'

interface Activity {
  activity: string
  availability: number
  type: string
  participants: number
  price: number
  accessibility: string
  duration: string
  kidFriendly: boolean
  link?: string
  key: string
}

const Bored = () => {
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('')
  const [filterParticipants, setFilterParticipants] = useState<string>('')
  const [isInputMode, setIsInputMode] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const isFetchingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const fetchRandomActivity = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current || loading) {
      return
    }

    // Rate limiting: prevent API abuse
    if (!apiRateLimiter()) {
      setError('Too many requests. Please wait a moment before trying again.')
      return
    }

    isFetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      // Use proxy for both development and production (Vercel handles proxy in production)
      const apiBase = '/api/bored'
      
      let url = `${apiBase}/random`
      
      if (filterType || filterParticipants) {
        const params = new URLSearchParams()
        // Validate filterType against whitelist
        const validTypes = ['education', 'recreational', 'social', 'charity', 'cooking', 'relaxation', 'busywork']
        if (filterType && validTypes.includes(filterType)) {
          params.append('type', filterType)
        }
        // Validate participants is a valid number
        const participantsNum = parseInt(filterParticipants, 10)
        if (filterParticipants && !isNaN(participantsNum) && participantsNum > 0 && participantsNum <= 8) {
          params.append('participants', filterParticipants)
        }
        if (params.toString()) {
        url = `${apiBase}/filter?${params.toString()}`
        }
      }
      
      if (import.meta.env.DEV) {
      console.log('Fetching from:', url)
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        if (import.meta.env.DEV) {
        console.error('Response error:', errorText)
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      // Check if API returned an error object (according to docs, filter endpoint returns {"error": "..."} when no results)
      if (data.error) {
        setError(data.error)
        setActivity(null)
        return
      }
      
      if (filterType || filterParticipants) {
        // For filtered requests, we get an array according to the docs
        if (Array.isArray(data)) {
          if (data.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.length)
            setActivity(data[randomIndex])
            setError(null)
          } else {
            setError('No activities found with these filters. Try different options.')
            setActivity(null)
          }
        } else {
          // If it's not an array, it might be an error object
          setError('No activities found with these filters. Try different options.')
          setActivity(null)
        }
      } else {
        // For random requests, we get a single object according to the docs
        if (data.activity) {
          setActivity(data)
          setError(null)
        } else {
          setError('Invalid response from API')
          setActivity(null)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (import.meta.env.DEV) {
      console.error('Error fetching activity:', err)
      }
      setError(`Failed to fetch activity: ${errorMessage}. Please try again.`)
      setActivity(null)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchRandomActivity()
  }, [])

  useEffect(() => {
    if (isInputMode && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isInputMode])

  // Sanitize input to prevent XSS and other attacks
  const sanitizeInput = (input: string): string => {
    // Remove any potentially dangerous characters
    // Allow only alphanumeric, spaces, and basic punctuation
    return input.replace(/[<>\"'&]/g, '').slice(0, 100) // Max 100 characters
  }

  useEffect(() => {
    if (!inputValue.trim()) return

    const sanitized = sanitizeInput(inputValue)
    const normalizedInput = sanitized.toLowerCase().trim()
    const jokeKeywords = ['joke', 'tell me a joke', 'jokes', 'make me laugh', 'funny', 'humor']
    
    if (jokeKeywords.some(keyword => normalizedInput.includes(keyword))) {
      navigate('/jokes')
    }
  }, [inputValue, navigate])

  const handleTitleClick = () => {
    setIsInputMode(true)
  }

  const handleInputBlur = () => {
    setIsInputMode(false)
    setInputValue('')
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsInputMode(false)
      setInputValue('')
    }
  }

  const activityTypes = [
    'education',
    'recreational',
    'social',
    'charity',
    'cooking',
    'relaxation',
    'busywork'
  ]

  const participantOptions = [1, 2, 3, 4, 5, 6, 8]

  return (
    <Layout>
      <div className="page-container">
        {isInputMode ? (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              const sanitized = sanitizeInput(e.target.value)
              setInputValue(sanitized)
            }}
            maxLength={100}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="page-title-input"
            placeholder="Type something..."
            autoFocus
            aria-label="Easter egg input - try typing 'joke'"
          />
        ) : (
          <h1 
            className="page-title" 
            onClick={handleTitleClick} 
            style={{ cursor: 'pointer' }}
            role="button"
            aria-label="Click to reveal easter egg"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleTitleClick()
              }
            }}
          >
            Bored?
          </h1>
        )}
        
        <div className="bored-filters">
          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">Any</option>
              {activityTypes.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="participants-filter">Participants:</label>
            <select
              id="participants-filter"
              value={filterParticipants}
              onChange={(e) => setFilterParticipants(e.target.value)}
              className="filter-select"
            >
              <option value="">Any</option>
              {participantOptions.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchRandomActivity}
          disabled={loading}
          className="bored-button"
        >
          {loading ? 'Loading...' : 'Get Activity'}
        </button>

        {error && (
          <div className="bored-error">{error}</div>
        )}

        {activity && !loading && (
          <div className="bored-activity">
            <h2 className="bored-activity-title">{activity.activity}</h2>
            
            <div className="bored-details">
              <div className="bored-detail-item">
                <span className="bored-detail-label">Type:</span>
                <span className="bored-detail-value">
                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                </span>
              </div>
              
              <div className="bored-detail-item">
                <span className="bored-detail-label">Participants:</span>
                <span className="bored-detail-value">{activity.participants}</span>
              </div>
              
              <div className="bored-detail-item">
                <span className="bored-detail-label">Price:</span>
                <span className="bored-detail-value">
                  {activity.price === 0 ? 'Free' : `$${activity.price.toFixed(2)}`}
                </span>
              </div>
              
              <div className="bored-detail-item">
                <span className="bored-detail-label">Accessibility:</span>
                <span className="bored-detail-value">{activity.accessibility}</span>
              </div>
              
              <div className="bored-detail-item">
                <span className="bored-detail-label">Duration:</span>
                <span className="bored-detail-value">{activity.duration}</span>
              </div>
              
              {activity.kidFriendly && (
                <div className="bored-detail-item">
                  <span className="bored-detail-label">Kid Friendly:</span>
                  <span className="bored-detail-value">Yes</span>
                </div>
              )}
            </div>

            {activity.link && (
              <a
                href={activity.link}
                target="_blank"
                rel="noopener noreferrer"
                className="bored-link"
              >
                Learn More →
              </a>
            )}
          </div>
        )}

        <div className="bored-attribution">
          <p className="bored-attribution-text">
            Powered by{' '}
            <a
              href="https://bored-api.appbrewery.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="bored-attribution-link"
            >
              Bored API
            </a>
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Bored

