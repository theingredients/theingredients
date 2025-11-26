import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Icon from '../components/Icon'
import { isValidCoordinates, sanitizeApiResponse } from '../utils/inputSanitizer'
import { logApiError } from '../utils/logger'
import './Home.css'

interface WeatherData {
  temp: number
  tempC?: number
  description: string
  city: string
  icon: string
  tide?: {
    height: number
    type: 'high' | 'low'
    time: string
    nextType: 'high' | 'low'
    nextTime: string
  }
}

const Home = () => {
  const [time, setTime] = useState(new Date())
  const [clickCount, setClickCount] = useState(0)
  const [showWeather, setShowWeather] = useState(false)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFallingApart, setIsFallingApart] = useState(false)
  const [animationVariant, setAnimationVariant] = useState<string>('')
  const longPressTimerRef = useRef<number | null>(null)
  const isPressingRef = useRef<boolean>(false)
  const touchHandledRef = useRef<boolean>(false)
  const isFetchingWeatherRef = useRef<boolean>(false)
  const lastWeatherFetchRef = useRef<number>(0)
  const navigate = useNavigate()
  
  // Rate limiting: minimum 3 seconds between weather API calls
  const MIN_WEATHER_FETCH_INTERVAL = 3000 // 3 seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (clickCount >= 7) {
      navigate('/bored')
    }
  }, [clickCount, navigate])

  // Fetch tide data using Open-Meteo Marine API
  const fetchTideData = useCallback(async (latitude: number, longitude: number): Promise<WeatherData['tide'] | null> => {
    try {
      const tideAbortController = new AbortController()
      const tideTimeoutId = setTimeout(() => tideAbortController.abort(), 5000) // 5 second timeout
      
      // Use Open-Meteo marine API to get actual tide data
      // This API provides water level data which can indicate tides
      const marineResponse = await fetch(
        `https://marine-api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}&hourly=water_level&forecast_days=1`,
        { signal: tideAbortController.signal }
      )
      
      clearTimeout(tideTimeoutId)
      
      if (!marineResponse.ok) {
        return null // Not near ocean or API unavailable
      }

      const marineData = await marineResponse.json()
      
      // Check if we have water level data (indicates location is near water)
      if (!marineData.hourly || !marineData.hourly.water_level || marineData.hourly.water_level.length === 0) {
        return null
      }
      
      const waterLevels = marineData.hourly.water_level
      const times = marineData.hourly.time || []
      
      if (waterLevels.length === 0 || times.length === 0) {
        return null
      }
      
      // Find current time index
      const now = new Date()
      const currentTimeStr = now.toISOString().slice(0, 13) + ':00' // Round to nearest hour
      let currentIndex = times.findIndex((t: string) => t >= currentTimeStr)
      
      // If current time not found, use first available
      if (currentIndex === -1) {
        currentIndex = 0
      }
      
      // Get current water level
      const currentLevel = waterLevels[currentIndex] || waterLevels[0]
      
      // Find next high and low tides in the next 24 hours
      let nextHighIndex = -1
      let nextLowIndex = -1
      let maxLevel = currentLevel
      let minLevel = currentLevel
      
      // Look ahead up to 24 hours
      const lookAhead = Math.min(24, waterLevels.length - currentIndex)
      
      for (let i = currentIndex; i < currentIndex + lookAhead; i++) {
        const level = waterLevels[i]
        if (level > maxLevel) {
          maxLevel = level
          nextHighIndex = i
        }
        if (level < minLevel) {
          minLevel = level
          nextLowIndex = i
        }
      }
      
      // Determine current tide state based on water level trend
      const avgLevel = (maxLevel + minLevel) / 2
      const isHigh = currentLevel >= avgLevel
      const currentType: 'high' | 'low' = isHigh ? 'high' : 'low'
      
      // Find next tide change
      let nextType: 'high' | 'low'
      let nextTime: string
      
      if (isHigh) {
        // Currently high, next will be low
        nextType = 'low'
        if (nextLowIndex !== -1 && nextLowIndex > currentIndex) {
          nextTime = new Date(times[nextLowIndex]).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        } else {
          // Estimate next low tide (approximately 6 hours from now)
          const nextLowDate = new Date(now.getTime() + 6 * 60 * 60 * 1000)
          nextTime = nextLowDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
      } else {
        // Currently low, next will be high
        nextType = 'high'
        if (nextHighIndex !== -1 && nextHighIndex > currentIndex) {
          nextTime = new Date(times[nextHighIndex]).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        } else {
          // Estimate next high tide (approximately 6 hours from now)
          const nextHighDate = new Date(now.getTime() + 6 * 60 * 60 * 1000)
          nextTime = nextHighDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
      }
      
      // Calculate tide height in feet (water level is typically in meters)
      // Use the range between min and max as reference
      const levelRange = maxLevel - minLevel
      const normalizedLevel = (currentLevel - minLevel) / (levelRange || 1)
      const estimatedHeight = minLevel + (normalizedLevel * levelRange)
      
      // Format current time
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
      
      return {
        height: Math.round(Math.abs(estimatedHeight) * 3.28084), // Convert to feet, ensure positive
        type: currentType,
        time: currentTime,
        nextType: nextType,
        nextTime: nextTime
      }
    } catch (error) {
      // Not near ocean or API unavailable
      if (import.meta.env.DEV) {
        console.log('[Weather] Tide data unavailable:', error)
      }
      return null
    }
  }, [])

  const fetchWeather = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingWeatherRef.current) {
      if (import.meta.env.DEV) {
        console.log('[Weather] fetchWeather already in progress, skipping')
      }
      return
    }
    
    // Rate limiting: prevent rapid successive calls
    const now = Date.now()
    const timeSinceLastFetch = now - lastWeatherFetchRef.current
    if (timeSinceLastFetch < MIN_WEATHER_FETCH_INTERVAL) {
      const remainingTime = Math.ceil((MIN_WEATHER_FETCH_INTERVAL - timeSinceLastFetch) / 1000)
      if (import.meta.env.DEV) {
        console.log(`[Weather] Rate limited - please wait ${remainingTime} more second(s)`)
      }
      setError(`Please wait ${remainingTime} more second(s) before fetching weather again`)
      return
    }
    
    lastWeatherFetchRef.current = now
    isFetchingWeatherRef.current = true
    setLoading(true)
    setError(null)
    
    if (import.meta.env.DEV) {
      console.log('[Weather] fetchWeather started')
    }
    
    // Overall timeout to prevent infinite loading (20 seconds total)
    const overallTimeoutId = setTimeout(() => {
      setLoading(false)
      setError('Request timeout - please try again')
    }, 20000)
    
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser')
      }
      
      // Check permission state (if available) - helps diagnose permission issues
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
          if (import.meta.env.DEV) {
            console.log('[Weather] Geolocation permission state:', permission.state)
          }
          if (permission.state === 'denied') {
            throw new Error('Location access denied. Please enable location permissions in your browser settings.')
          }
        } catch (permError) {
          // Permission query not supported or failed - continue anyway
          if (import.meta.env.DEV) {
            console.log('[Weather] Permission query not available:', permError)
          }
        }
      }

      // Get user's location (longer timeout for mobile)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const geoTimeout = setTimeout(() => {
          reject(new Error('Location request timed out. Please check your location permissions and try again.'))
        }, 15000)
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(geoTimeout)
            resolve(pos)
          }, 
          (err) => {
            clearTimeout(geoTimeout)
            // Handle geolocation errors with better messages
            let errorMessage = 'Unable to get your location'
            if (err.code === 1) { // PERMISSION_DENIED
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.'
            } else if (err.code === 2) { // POSITION_UNAVAILABLE
              errorMessage = 'Location unavailable. Please check your device settings.'
            } else if (err.code === 3) { // TIMEOUT
              errorMessage = 'Location request timed out. Please try again.'
            }
            reject(new Error(errorMessage))
          },
          { 
            timeout: 15000, // 15 seconds for mobile devices
            enableHighAccuracy: false, // Faster on mobile
            maximumAge: 300000 // Accept cached location up to 5 minutes old
          }
        )
      })

      const { latitude, longitude } = position.coords

      // Validate coordinates are within valid ranges to prevent injection
      if (!isValidCoordinates(latitude, longitude)) {
        throw new Error('Invalid geolocation coordinates received')
      }

      // Get city name from reverse geocoding (non-blocking, with fallback)
      // We'll fetch this in parallel and update after weather is set
      let cityName = 'Unknown'
      
      const fetchCityName = async (): Promise<string> => {
        // Try primary geocoding API: BigDataCloud
        try {
          const geocodeAbortController = new AbortController()
          const geocodeTimeoutId = setTimeout(() => geocodeAbortController.abort(), 4000) // 4 second timeout
          
          const geocodeResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
            { signal: geocodeAbortController.signal }
          )
          
          clearTimeout(geocodeTimeoutId)
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json()
            const rawCityName = geocodeData.city || geocodeData.locality || geocodeData.principalSubdivision
            if (rawCityName) {
              return sanitizeApiResponse(rawCityName, 100)
            }
          }
        } catch (geocodeError) {
          if (import.meta.env.DEV) {
            console.log('[Weather] BigDataCloud geocoding failed, trying fallback:', geocodeError)
          }
        }
        
        // Fallback: Use Nominatim (OpenStreetMap) reverse geocoding API
        try {
          const fallbackAbortController = new AbortController()
          const fallbackTimeoutId = setTimeout(() => fallbackAbortController.abort(), 4000)
          
          const fallbackResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=en`,
            { 
              signal: fallbackAbortController.signal,
              headers: {
                'User-Agent': 'TheIngredients/1.0' // Required by Nominatim
              }
            }
          )
          
          clearTimeout(fallbackTimeoutId)
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            if (fallbackData.address) {
              // Try to get city name from address components
              const rawCityName = fallbackData.address.city || 
                                 fallbackData.address.town || 
                                 fallbackData.address.village || 
                                 fallbackData.address.municipality ||
                                 fallbackData.address.county ||
                                 fallbackData.address.state ||
                                 fallbackData.display_name?.split(',')[0]
              if (rawCityName) {
                return sanitizeApiResponse(rawCityName, 100)
              }
            }
          }
        } catch (fallbackError) {
          if (import.meta.env.DEV) {
            console.log('[Weather] Fallback geocoding failed:', fallbackError)
          }
        }
        
        return 'Unknown'
      }
      
      // Fetch city name in parallel (non-blocking)
      fetchCityName().then(name => {
        if (name !== 'Unknown') {
          setWeather(prev => prev ? { ...prev, city: name } : null)
        }
      }).catch(() => {
        // Silently fail - city name is optional
      })

      // Try primary API: Open-Meteo (free, no API key required)
      let weatherData: any = null
      let useFallback = false
      
      // Create abort controller for timeout
      const abortController = new AbortController()
      const timeoutId = setTimeout(() => abortController.abort(), 8000) // 8 second timeout
      
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`,
          { signal: abortController.signal }
        )
        
        clearTimeout(timeoutId)

        if (!weatherResponse.ok) {
          throw new Error('Open-Meteo API returned error')
        }

        weatherData = await weatherResponse.json()
        
        if (!weatherData.current_weather) {
          clearTimeout(timeoutId)
          throw new Error('Invalid response from Open-Meteo')
        }
      } catch (primaryError) {
        // Primary API failed, try fallback
        clearTimeout(timeoutId)
        if (import.meta.env.DEV) {
          console.log('[Weather] Primary API failed, trying fallback:', primaryError)
        }
        useFallback = true
        
        try {
          // Fallback API: wttr.in (free, no API key required)
          // Use coordinates for location
          const fallbackAbortController = new AbortController()
          const fallbackTimeoutId = setTimeout(() => fallbackAbortController.abort(), 8000)
          
          const fallbackResponse = await fetch(
            `https://wttr.in/${latitude},${longitude}?format=j1&lang=en`,
            { 
              signal: fallbackAbortController.signal,
              headers: {
                'Accept': 'application/json'
              }
            }
          )
          
          clearTimeout(fallbackTimeoutId)

          if (!fallbackResponse.ok) {
            throw new Error('Fallback API returned error')
          }

          const fallbackData = await fallbackResponse.json()
          
          if (!fallbackData.current_condition || !fallbackData.current_condition[0]) {
            clearTimeout(fallbackTimeoutId)
            throw new Error('Invalid response from fallback API')
          }

          const current = fallbackData.current_condition[0]
          
          // wttr.in returns temperature in Celsius
          const tempC = Math.round(parseFloat(current.temp_C) || 0)
          const tempF = Math.round((tempC * 9/5) + 32)
          
          // Map wttr.in weather code to description
          const weatherDesc = sanitizeApiResponse(current.weatherDesc?.[0]?.value || 'unknown', 50).toLowerCase()
          
          const weatherInfo: WeatherData = {
            temp: tempF,
            tempC: tempC,
            description: weatherDesc,
            city: cityName,
            icon: ''
          }

          setWeather(weatherInfo)
          
          // Try to fetch tide data if user is near the ocean (non-blocking)
          fetchTideData(latitude, longitude)
            .then(tideData => {
              if (tideData) {
                setWeather(prev => prev ? { ...prev, tide: tideData } : null)
              }
            })
            .catch(tideError => {
              // Silently fail - tide data is optional
              if (import.meta.env.DEV) {
                console.log('[Weather] Tide data unavailable:', tideError)
              }
            })
          
          return // Success with fallback
        } catch (fallbackError) {
          // Both APIs failed
          throw new Error('Unable to fetch weather from any source')
        }
      }

      // Primary API succeeded
      if (!useFallback && weatherData) {
        const current = weatherData.current_weather
        
        // Convert Celsius to Fahrenheit
        const tempC = Math.round(current.temperature)
        const tempF = Math.round((tempC * 9/5) + 32)
        
        // Map weather code to description
        const weatherDescriptions: { [key: number]: string } = {
          0: 'clear sky',
          1: 'mainly clear',
          2: 'partly cloudy',
          3: 'overcast',
          45: 'foggy',
          48: 'depositing rime fog',
          51: 'light drizzle',
          53: 'moderate drizzle',
          55: 'dense drizzle',
          56: 'light freezing drizzle',
          57: 'dense freezing drizzle',
          61: 'slight rain',
          63: 'moderate rain',
          65: 'heavy rain',
          66: 'light freezing rain',
          67: 'heavy freezing rain',
          71: 'slight snow',
          73: 'moderate snow',
          75: 'heavy snow',
          77: 'snow grains',
          80: 'slight rain showers',
          81: 'moderate rain showers',
          82: 'violent rain showers',
          85: 'slight snow showers',
          86: 'heavy snow showers',
          95: 'thunderstorm',
          96: 'thunderstorm with slight hail',
          99: 'thunderstorm with heavy hail'
        }

        const weatherInfo: WeatherData = {
          temp: tempF,
          tempC: tempC,
          description: sanitizeApiResponse(weatherDescriptions[current.weathercode] || 'unknown', 50),
          city: cityName,
          icon: ''
        }

        setWeather(weatherInfo)
        
        // Try to fetch tide data if user is near the ocean (non-blocking)
        fetchTideData(latitude, longitude)
          .then(tideData => {
            if (tideData) {
              setWeather(prev => prev ? { ...prev, tide: tideData } : null)
            }
          })
          .catch(tideError => {
            // Silently fail - tide data is optional
            if (import.meta.env.DEV) {
              console.log('[Weather] Tide data unavailable:', tideError)
            }
          })
      }
    } catch (err) {
      // Handle all error types with better messages
      if (err instanceof Error) {
        setError(err.message)
        logApiError('Weather API', err, {
          errorMessage: err.message,
          errorName: err.name,
        })
      } else {
        const errorMessage = 'Unable to fetch weather. Please try again.'
        setError(errorMessage)
        logApiError('Weather API', new Error(errorMessage), {
          errorMessage,
        })
      }
    } finally {
      clearTimeout(overallTimeoutId)
      setLoading(false)
      isFetchingWeatherRef.current = false
    }
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[Weather] useEffect triggered:', { showWeather, hasWeather: !!weather, loading, error })
    }
    if (showWeather && !weather && !loading && !error) {
      if (import.meta.env.DEV) {
        console.log('[Weather] Calling fetchWeather()')
      }
      fetchWeather()
    }
  }, [showWeather, weather, loading, error, fetchWeather])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const splitIntoCharacters = (text: string, className: string = '') => {
    return text.split('').map((char, index) => (
      <span key={`${text}-char-${index}-${char}`} className={char === ' ' ? 'char-space' : `char-${index} ${className}`}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
  }

  // Generate Matrix rain characters - many characters falling down
  const generateMatrixRain = () => {
    // Characters that look like Matrix code (numbers, letters, symbols)
    const matrixChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const columns = 40 // Number of columns
    const charsPerColumn = 30 // Characters per column
    
    const rainChars: JSX.Element[] = []
    
    for (let col = 0; col < columns; col++) {
      const columnLeft = (col / columns) * 100
      const startDelay = Math.random() * 2 // Random start delay for each column
      
      for (let row = 0; row < charsPerColumn; row++) {
        const randomChar = matrixChars[Math.floor(Math.random() * matrixChars.length)]
        // Stagger characters in each column
        const delay = startDelay + (row * 0.1)
        const duration = 3 + Math.random() * 2 // Vary speed slightly
        
        rainChars.push(
          <span
            key={`matrix-${col}-${row}`}
            className="matrix-rain-char"
            style={{
              left: `${columnLeft}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`
            }}
          >
            {randomChar}
          </span>
        )
      }
    }
    
    return rainChars
  }

  const getWeatherCursorClass = (description: string): string => {
    const desc = description.toLowerCase()
    if (desc.includes('clear') || desc.includes('sunny')) {
      return 'weather-cursor-sunny'
    } else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return 'weather-cursor-rainy'
    } else if (desc.includes('snow')) {
      return 'weather-cursor-snowy'
    } else if (desc.includes('thunder') || desc.includes('storm')) {
      return 'weather-cursor-stormy'
    } else if (desc.includes('fog') || desc.includes('mist')) {
      return 'weather-cursor-foggy'
    } else if (desc.includes('cloud') || desc.includes('overcast')) {
      return 'weather-cursor-cloudy'
    }
    return 'weather-cursor-default'
  }

  const getWeatherIcon = (description: string): React.ReactNode => {
    const desc = description.toLowerCase()
    if (desc.includes('clear') || desc.includes('sunny')) {
      return <Icon name="sun" size={24} ariaHidden={true} />
    } else if (desc.includes('thunder') || desc.includes('storm')) {
      return <Icon name="cloud-lightning" size={24} ariaHidden={true} />
    } else if (desc.includes('rain') || desc.includes('drizzle') || desc.includes('shower')) {
      return <Icon name="cloud-rain" size={24} ariaHidden={true} />
    } else if (desc.includes('snow')) {
      return <Icon name="cloud-snow" size={24} ariaHidden={true} />
    } else if (desc.includes('fog') || desc.includes('mist')) {
      return <Icon name="cloud-fog" size={24} ariaHidden={true} />
    } else if (desc.includes('cloud') || desc.includes('overcast')) {
      return <Icon name="cloud" size={24} ariaHidden={true} />
    }
    return <Icon name="cloud" size={24} ariaHidden={true} /> // Default to cloud
  }

  const handleIngredientsClick = () => {
    setClickCount(prev => prev + 1)
  }

  const toggleWeather = () => {
    if (import.meta.env.DEV) {
      console.log('[Weather] toggleWeather called, current showWeather:', showWeather, 'hasWeather:', !!weather)
    }
    if (showWeather) {
      // Toggling off - hide weather
      setShowWeather(false)
      setWeather(null)
      setError(null)
      setLoading(false)
    } else {
      // Toggling on - show weather (always fetch fresh data)
      setShowWeather(true)
      setWeather(null) // Reset weather
      setError(null)
      // Call fetchWeather directly to ensure it always runs
      fetchWeather()
    }
  }

  const handleClockClick = (e?: React.MouseEvent | React.TouchEvent) => {
    // Prevent double-firing on mobile (touch + click)
    if (touchHandledRef.current) {
      touchHandledRef.current = false
      return
    }
    
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    toggleWeather()
  }

  const handleClockTouchEnd = (e: React.TouchEvent) => {
    if (import.meta.env.DEV) {
      console.log('[Weather] Touch end event fired on clock')
    }
    // Prevent the click event from also firing
    touchHandledRef.current = true
    e.preventDefault()
    e.stopPropagation()
    
    // Toggle weather immediately
    toggleWeather()
    
    // Reset after a delay to allow click event to be ignored if it fires
    setTimeout(() => {
      touchHandledRef.current = false
    }, 300)
  }

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setError(null)
    setWeather(null)
    setLoading(true)
    fetchWeather()
  }

  const handleThePressStart = () => {
    isPressingRef.current = true
    const timer = window.setTimeout(() => {
      // Only start animation if still pressing
      if (isPressingRef.current) {
        // Randomly select an animation variant
        const variants = ['shake', 'spin', 'explode', 'glitch', 'wobble', 'chaos', 'disintegrate', 'float', 'bounce', 'wave', 'pulse', 'jitter', 'stretch', 'flip', 'slide', 'zoom', 'elastic', 'orbit', 'matrix', 'matrix-rain', 'blur', 'squash', 'twirl', 'pop', 'ripple', 'tumble', 'rainbow', 'spiral', 'morph', 'scatter', 'vortex', 'melt', 'teleport', 'zigzag', 'spiral-in', 'gravity', 'magnetic', 'dance', 'swirl', 'flicker-fast', 'break-apart']
        const randomVariant = variants[Math.floor(Math.random() * variants.length)]
        setAnimationVariant(randomVariant)
        setIsFallingApart(true)
      }
    }, 500) // 500ms hold duration
    
    longPressTimerRef.current = timer
  }

  const handleThePressEnd = () => {
    isPressingRef.current = false
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsFallingApart(false)
    setAnimationVariant('')
  }

  const handleTheMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    handleThePressStart()
  }

  const handleTheMouseUp = () => {
    handleThePressEnd()
  }

  const handleTheMouseLeave = (e: React.MouseEvent) => {
    // Only stop animation if mouse button is not pressed (button 0 = left button)
    // If buttons property is 0, no button is pressed
    if (e.buttons === 0) {
      handleThePressEnd()
    }
  }

  const handleTheTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleThePressStart()
  }

  const handleTheTouchMove = (e: React.TouchEvent) => {
    // Prevent default to avoid scrolling while holding, but don't cancel the animation
    // Only prevent if we're actually in the animation state
    if (isFallingApart) {
      e.preventDefault()
    }
  }

  const handleTheTouchEnd = () => {
    handleThePressEnd()
  }

  const handleTheTouchCancel = () => {
    // Touch cancel fires when the browser cancels the touch (e.g., during scrolling)
    // This is correct behavior - stop the animation
    handleThePressEnd()
  }

  return (
    <Layout>
      <div className={`home-container ${isFallingApart ? `falling-apart variant-${animationVariant}` : ''}`}>
        {isFallingApart && animationVariant === 'matrix-rain' && (
          <div className="matrix-rain-overlay">
            {generateMatrixRain()}
          </div>
        )}
        <div className="title-stack">
          <h1 
            className="title-line"
            onMouseDown={handleTheMouseDown}
            onMouseUp={handleTheMouseUp}
            onMouseLeave={handleTheMouseLeave}
            onTouchStart={handleTheTouchStart}
            onTouchMove={handleTheTouchMove}
            onTouchEnd={handleTheTouchEnd}
            onTouchCancel={handleTheTouchCancel}
            aria-label="Hold to activate easter egg"
            title="Hold to activate easter egg"
          >
            {isFallingApart ? splitIntoCharacters('The', 'title-char') : 'The'}
          </h1>
          <h1 className="title-line clickable-title" onClick={handleIngredientsClick}>
            {isFallingApart ? splitIntoCharacters('Ingredients', 'title-char') : 'Ingredients'}
          </h1>
          <div 
            className={`clock ${showWeather ? 'weather-view' : ''} ${loading ? 'weather-loading-state' : ''}`}
            onClick={handleClockClick}
            onTouchEnd={handleClockTouchEnd}
            role="button"
            tabIndex={0}
            aria-label="Click to toggle weather"
          >
            {showWeather ? (
              <div className="weather-display">
                {loading && (
                  <div className="weather-loading">
                    {isFallingApart ? (
                      <span className="weather-loading-char-container">
                        {splitIntoCharacters('Loading...', 'weather-loading-char')}
                      </span>
                    ) : (
                      'Loading...'
                    )}
                  </div>
                )}
                {error && (
                  <div className="weather-error">
                    {isFallingApart ? (
                      <span className="weather-error-char-container">
                        {splitIntoCharacters(error, 'weather-error-char')}
                      </span>
                    ) : (
                      error
                    )}
                    {error.includes('denied') && (
                      <div 
                        className="weather-retry" 
                        onClick={handleRetry}
                      >
                        {isFallingApart ? (
                          <span className="weather-retry-char-container">
                            {splitIntoCharacters('Click to retry', 'weather-retry-char')}
                          </span>
                        ) : (
                          'Click to retry'
                        )}
                      </div>
                    )}
                  </div>
                )}
                {weather && !loading && (
                  <>
                    {isFallingApart ? (
                      <>
                        <span className={`weather-temp ${getWeatherCursorClass(weather.description)}`}>
                          <span className="weather-icon">{getWeatherIcon(weather.description)}</span>
                          <span className="weather-temp-char-container">
                            {splitIntoCharacters(`${weather.temp}°F / ${weather.tempC ?? Math.round((weather.temp - 32) * 5/9)}°C`, 'weather-temp-char')}
                          </span>
                        </span>
                        <span className="weather-location">
                          <span className="weather-location-char-container">
                            {splitIntoCharacters(weather.city, 'weather-location-char')}
                          </span>
                        </span>
                        {weather.tide && (
                          <span className="weather-tide">
                            <span className="weather-tide-char-container">
                              {splitIntoCharacters(`Tide: ${weather.tide.type === 'high' ? 'High' : 'Low'} (${weather.tide.height}ft), Next ${weather.tide.nextType === 'high' ? 'High' : 'Low'}: ${weather.tide.nextTime}`, 'weather-tide-char')}
                            </span>
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className={`weather-temp ${getWeatherCursorClass(weather.description)}`}>
                          <span className="weather-icon">{getWeatherIcon(weather.description)}</span>
                          {weather.temp}°F / {weather.tempC ?? Math.round((weather.temp - 32) * 5/9)}°C
                        </span>
                        <span className="weather-location">{weather.city}</span>
                        {weather.tide && (
                          <span className="weather-tide">
                            Tide: {weather.tide.type === 'high' ? 'High' : 'Low'} ({weather.tide.height}ft), Next {weather.tide.nextType === 'high' ? 'High' : 'Low'}: {weather.tide.nextTime}
                          </span>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            ) : (
              isFallingApart ? (
                <span className="clock-char-container">
                  {splitIntoCharacters(formatTime(time), 'clock-char')}
                </span>
            ) : (
              formatTime(time)
              )
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Home

