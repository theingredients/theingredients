import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import './Home.css'

interface WeatherData {
  temp: number
  tempC?: number
  description: string
  city: string
  icon: string
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
  const navigate = useNavigate()

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

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Check if geolocation is available
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser')
      }

      // Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject,
          { timeout: 10000 }
        )
      })

      const { latitude, longitude } = position.coords

      // Use Open-Meteo (free, no API key required)
      // First get city name from reverse geocoding
      const geocodeResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      )
      
      let cityName = 'Unknown'
      if (geocodeResponse.ok) {
        const geocodeData = await geocodeResponse.json()
        cityName = geocodeData.city || geocodeData.locality || geocodeData.principalSubdivision || 'Unknown'
      }

      // Get weather data from Open-Meteo (in Celsius, we'll convert to Fahrenheit)
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`
      )

      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather')
      }

      const weatherData = await weatherResponse.json()
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

      setWeather({
        temp: tempF,
        tempC: tempC,
        description: weatherDescriptions[current.weathercode] || 'unknown',
        city: cityName,
        icon: ''
      })
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable')
        } else {
          setError('Location timeout')
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to fetch weather')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (showWeather && !weather && !loading) {
      fetchWeather()
    }
  }, [showWeather, weather, loading, fetchWeather])

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
      <span key={index} className={char === ' ' ? 'char-space' : `char-${index} ${className}`}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))
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

  const handleIngredientsClick = () => {
    setClickCount(prev => prev + 1)
  }

  const handleClockClick = () => {
    if (showWeather) {
      setShowWeather(false)
      setWeather(null)
      setError(null)
      setLoading(false)
    } else {
      setShowWeather(true)
    }
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
    const timer = window.setTimeout(() => {
      // Randomly select an animation variant
      const variants = ['shake', 'spin', 'explode', 'glitch', 'wobble', 'chaos', 'disintegrate', 'float']
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      setAnimationVariant(randomVariant)
      setIsFallingApart(true)
    }, 500) // 500ms hold duration
    
    longPressTimerRef.current = timer
  }

  const handleThePressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsFallingApart(false)
    setAnimationVariant('')
  }

  const handleTheMouseDown = () => {
    handleThePressStart()
  }

  const handleTheMouseUp = () => {
    handleThePressEnd()
  }

  const handleTheMouseLeave = () => {
    handleThePressEnd()
  }

  const handleTheTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleThePressStart()
  }

  const handleTheTouchEnd = () => {
    handleThePressEnd()
  }

  const handleTheTouchCancel = () => {
    // Handle touch cancellation (e.g., when scrolling starts)
    handleThePressEnd()
  }

  return (
    <Layout>
      <div className={`home-container ${isFallingApart ? `falling-apart variant-${animationVariant}` : ''}`}>
        <div className="title-stack">
          <h1 
            className="title-line"
            onMouseDown={handleTheMouseDown}
            onMouseUp={handleTheMouseUp}
            onMouseLeave={handleTheMouseLeave}
            onTouchStart={handleTheTouchStart}
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
          >
            {showWeather ? (
              <div className="weather-display">
                {loading && <div className="weather-loading">Loading...</div>}
                {error && (
                  <div className="weather-error">
                    {error}
                    {error.includes('denied') && (
                      <div 
                        className="weather-retry" 
                        onClick={handleRetry}
                      >
                        Click to retry
                      </div>
                    )}
                  </div>
                )}
                {weather && !loading && !error && (
                  <>
                    <span className={`weather-temp ${getWeatherCursorClass(weather.description)}`}>
                      {weather.temp}°F / {weather.tempC ?? Math.round((weather.temp - 32) * 5/9)}°C
                    </span>
                    <span className="weather-location">{weather.city}</span>
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

