import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import { apiRateLimiter } from '../utils/rateLimiter'
import './PageStyles.css'
import './Jokes.css'

interface Joke {
  error?: boolean
  category?: string
  type: 'single' | 'twopart'
  joke?: string
  setup?: string
  delivery?: string
  flags?: {
    nsfw: boolean
    religious: boolean
    political: boolean
    racist: boolean
    sexist: boolean
    explicit: boolean
  }
  id?: number
  safe?: boolean
  lang?: string
}

const Jokes = () => {
  const [joke, setJoke] = useState<Joke | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('Any')
  const [filterType, setFilterType] = useState<string>('')
  const [blacklistFlags, setBlacklistFlags] = useState<string[]>([])
  const isFetchingRef = useRef(false)

  const fetchRandomJoke = async () => {
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
      const apiBase = '/api/jokeapi'
      
      // Validate category against whitelist to prevent path traversal
      const validCategories = ['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas']
      const safeCategory = validCategories.includes(filterCategory) ? filterCategory : 'Any'
      
      let url = `${apiBase}/joke/${encodeURIComponent(safeCategory)}`
      
      const params = new URLSearchParams()
      // Validate filterType
      const validTypes = ['single', 'twopart']
      if (filterType && validTypes.includes(filterType)) {
        params.append('type', filterType)
      }
      // Validate blacklistFlags against whitelist
      const validFlags = ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']
      const safeFlags = blacklistFlags.filter(flag => validFlags.includes(flag))
      if (safeFlags.length > 0) {
        params.append('blacklistFlags', safeFlags.join(','))
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
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
      
      // Check if API returned an error object
      if (data.error) {
        setError(data.error)
        setJoke(null)
        return
      }
      
      setJoke(data)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      if (import.meta.env.DEV) {
        console.error('Error fetching joke:', err)
      }
      setError(`Failed to fetch joke: ${errorMessage}. Please try again.`)
      setJoke(null)
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchRandomJoke()
  }, [])

  const categories = ['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas']
  const jokeTypes = ['', 'single', 'twopart']
  const availableFlags = ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']

  const handleFlagToggle = (flag: string) => {
    setBlacklistFlags(prev => 
      prev.includes(flag) 
        ? prev.filter(f => f !== flag)
        : [...prev, flag]
    )
  }

  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Jokes</h1>
        
        <div className="jokes-filters">
          <div className="filter-group">
            <label htmlFor="category-filter">Category:</label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="type-filter">Type:</label>
            <select
              id="type-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              {jokeTypes.map((type) => (
                <option key={type || 'any'} value={type}>
                  {type || 'Any'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="jokes-flags">
          <label className="flags-label">Blacklist Flags:</label>
          <div className="flags-container">
            {availableFlags.map((flag) => (
              <label key={flag} className="flag-checkbox">
                <input
                  type="checkbox"
                  checked={blacklistFlags.includes(flag)}
                  onChange={() => handleFlagToggle(flag)}
                />
                <span>{flag}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={fetchRandomJoke}
          disabled={loading}
          className="jokes-button"
        >
          {loading ? 'Loading...' : 'Get Joke'}
        </button>

        {error && (
          <div className="jokes-error">{error}</div>
        )}

        {joke && !loading && !joke.error && (
          <div className="jokes-joke">
            {joke.type === 'single' ? (
              <p className="jokes-joke-text">{joke.joke}</p>
            ) : (
              <div className="jokes-twopart">
                <p className="jokes-setup">{joke.setup}</p>
                <p className="jokes-delivery">{joke.delivery}</p>
              </div>
            )}
            
            {joke.category && (
              <div className="jokes-meta">
                <span className="jokes-category">Category: {joke.category}</span>
              </div>
            )}
          </div>
        )}

        <div className="jokes-attribution">
          <p className="jokes-attribution-text">
            Powered by{' '}
            <a
              href="https://sv443.net/jokeapi/v2/"
              target="_blank"
              rel="noopener noreferrer"
              className="jokes-attribution-link"
            >
              JokeAPI
            </a>
          </p>
        </div>
      </div>
    </Layout>
  )
}

export default Jokes

