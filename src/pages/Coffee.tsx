import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import BuyMeACoffee from '../components/BuyMeACoffee'
import { isValidCoordinates, sanitizeApiResponse } from '../utils/inputSanitizer'
import './PageStyles.css'
import './Coffee.css'

interface CoffeeShop {
  id: number
  name: string
  lat: number
  lon: number
  distance?: number
  tags?: {
    'addr:street'?: string
    'addr:city'?: string
    'addr:housenumber'?: string
    'addr:postcode'?: string
    phone?: string
    website?: string
  }
}

const Coffee = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coffeeShops, setCoffeeShops] = useState<CoffeeShop[]>([])

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Convert distance to miles
  const kmToMiles = (km: number): number => {
    return km * 0.621371
  }

  // Format distance for display
  const formatDistance = (km: number): string => {
    const miles = kmToMiles(km)
    if (miles < 0.1) {
      return `${Math.round(miles * 5280)} ft`
    } else if (miles < 1) {
      return `${miles.toFixed(2)} mi`
    } else {
      return `${miles.toFixed(1)} mi`
    }
  }

  // Check if a place is a corporate chain
  const isCorporateChain = (name: string, brand?: string): boolean => {
    const nameLower = name.toLowerCase()
    const brandLower = brand?.toLowerCase() || ''
    
    // List of known corporate coffee chains
    const corporateChains = [
      'starbucks',
      'dunkin',
      'dunkin\' donuts',
      'dunkin donuts',
      'mcdonald\'s',
      'mcdonalds',
      'tim hortons',
      'tim horton\'s',
      'peet\'s',
      'peets',
      'caribou coffee',
      'costa coffee',
      'caffè nero',
      'caffe nero',
      'second cup',
      'tullys',
      'tully\'s',
      'seattle\'s best',
      'seattles best',
      'panera',
      'panera bread',
      'krispy kreme',
      'krispy kreme donuts',
      'biggby',
      'biggby coffee',
      'the coffee bean',
      'coffee bean & tea leaf',
      'coffee bean and tea leaf',
      'blue bottle',
      'blue bottle coffee',
      'intelligentsia',
      'counter culture',
      'philz',
      'philz coffee',
      'lavazza',
      'nespresso',
      'illy',
      'café bustelo',
      'cafe bustelo',
      'folgers',
      'maxwell house',
      'green mountain',
      'keurig',
      'dunkin\'',
      'dd',
      'sbux',
      'mccafé',
      'mccafe',
    ]

    // Check if name or brand matches any corporate chain
    return corporateChains.some(chain => 
      nameLower.includes(chain) || brandLower.includes(chain)
    )
  }


  // Open location in device's maps app
  const openInMaps = (lat: number, lon: number, name: string, address?: string) => {
    // Detect device type for better map URL handling
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    const isAndroid = /android/i.test(userAgent)
    
    // Use address if available, otherwise use coordinates
    const searchQuery = address && address !== 'Address not available' 
      ? encodeURIComponent(`${name}, ${address}`)
      : `${lat},${lon}`
    
    let mapUrl: string
    
    if (isIOS) {
      // iOS: Use Apple Maps URL scheme with address
      mapUrl = `http://maps.apple.com/?q=${searchQuery}&ll=${lat},${lon}`
    } else if (isAndroid) {
      // Android: Use geo: URI scheme with address
      if (address && address !== 'Address not available') {
        mapUrl = `geo:${lat},${lon}?q=${encodeURIComponent(`${name}, ${address}`)}`
      } else {
        mapUrl = `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(name)})`
      }
    } else {
      // Desktop/Other: Use Google Maps web URL with address
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
    }
    
    // Try to open native maps
    try {
      window.location.href = mapUrl
    } catch (err) {
      // Fallback to Google Maps web URL
      const webUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`
      window.open(webUrl, '_blank')
    }
  }

  // Check if a place is a restaurant (not just a coffee shop)
  const isRestaurant = (tags: any): boolean => {
    // Exclude if it's explicitly a restaurant
    if (tags?.amenity === 'restaurant') {
      return true
    }
    
    // Exclude if it has restaurant-related cuisine tags that aren't coffee-focused
    const cuisine = tags?.cuisine?.toLowerCase() || ''
    const restaurantCuisines = ['pizza', 'italian', 'mexican', 'chinese', 'japanese', 'thai', 'indian', 'french', 'american', 'burger', 'sandwich', 'breakfast', 'brunch']
    
    // If it has a restaurant cuisine but no coffee-related tags, it's likely a restaurant
    if (restaurantCuisines.some(c => cuisine.includes(c)) && !tags?.amenity && !tags?.shop) {
      return true
    }
    
    return false
  }

  // Fetch coffee shops and cafes from OSM Overpass API
  const fetchCoffeeShops = async (lat: number, lon: number) => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate coordinates
      if (!isValidCoordinates(lat, lon)) {
        throw new Error('Invalid coordinates')
      }

      // Search radius in meters (approximately 5km)
      const radius = 5000

      // Overpass API query to find coffee shops and cafes
      // Exclude restaurants explicitly
      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="cafe"]["amenity"!="restaurant"](around:${radius},${lat},${lon});
          node["shop"="coffee"](around:${radius},${lat},${lon});
          way["amenity"="cafe"]["amenity"!="restaurant"](around:${radius},${lat},${lon});
          way["shop"="coffee"](around:${radius},${lat},${lon});
        );
        out center meta;
      `.replace(/\s+/g, ' ').trim()

      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      })

      if (!response.ok) {
        throw new Error('Failed to fetch coffee shops')
      }

      const data = await response.json()

      if (!data.elements || !Array.isArray(data.elements)) {
        throw new Error('Invalid response from OSM API')
      }

      // Process results
      const shops: CoffeeShop[] = data.elements
        .map((element: any, index: number) => {
          const center = element.center || { lat: element.lat, lon: element.lon }
          
          if (!center.lat || !center.lon) {
            return null
          }

          const name = sanitizeApiResponse(
            element.tags?.name || 
            element.tags?.['addr:housenumber'] || 
            'Unnamed Coffee Shop',
            100
          )

          const brand = sanitizeApiResponse(element.tags?.brand, 100)

          // Filter out corporate chains and restaurants
          if (isCorporateChain(name, brand) || isRestaurant(element.tags)) {
            return null
          }

          const distance = calculateDistance(lat, lon, center.lat, center.lon)

          return {
            id: element.id || index,
            name,
            lat: center.lat,
            lon: center.lon,
            distance,
            tags: {
              'addr:street': sanitizeApiResponse(element.tags?.['addr:street'], 100),
              'addr:city': sanitizeApiResponse(element.tags?.['addr:city'], 100),
              'addr:housenumber': sanitizeApiResponse(element.tags?.['addr:housenumber'], 20),
              'addr:postcode': sanitizeApiResponse(element.tags?.['addr:postcode'], 20),
              phone: sanitizeApiResponse(element.tags?.phone, 50),
              website: sanitizeApiResponse(element.tags?.website, 200),
            },
          }
        })
        .filter((shop: CoffeeShop | null): shop is CoffeeShop => shop !== null)
        .sort((a: CoffeeShop, b: CoffeeShop) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20) // Limit to top 20 closest

      setCoffeeShops(shops)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to fetch coffee shops')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle button click - request geolocation
  const handleFindCoffeeShops = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsModalOpen(true)
      return
    }

    setIsModalOpen(true)
    setIsLoading(true)
    setError(null)
    setCoffeeShops([])

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (!isValidCoordinates(latitude, longitude)) {
          setError('Invalid geolocation coordinates received')
          setIsLoading(false)
          return
        }

        fetchCoffeeShops(latitude, longitude)
      },
      (err) => {
        setIsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please enable location permissions to find nearby coffee shops.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable. Please try again.')
        } else {
          setError('Location timeout. Please try again.')
        }
      },
      { timeout: 10000 }
    )
  }

  // Close modal and clean up
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setError(null)
    setCoffeeShops([])
  }

  // Format address from tags
  const formatAddress = (shop: CoffeeShop): string => {
    const parts: string[] = []
    if (shop.tags?.['addr:housenumber']) {
      parts.push(shop.tags['addr:housenumber'])
    }
    if (shop.tags?.['addr:street']) {
      parts.push(shop.tags['addr:street'])
    }
    if (shop.tags?.['addr:city']) {
      parts.push(shop.tags['addr:city'])
    }
    if (shop.tags?.['addr:postcode']) {
      parts.push(shop.tags['addr:postcode'])
    }
    return parts.length > 0 ? parts.join(' ') : 'Address not available'
  }

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  return (
    <Layout>
      <div className="page-container">
        <div className="coffee-section">
          <h1 className="page-title">Find Local Coffee Shops!</h1>
          <button 
            className="email-button coffee-section-button"
            onClick={handleFindCoffeeShops}
          >
            Find Nearby!
          </button>
        </div>
        <div className="coffee-section">
          <h1 className="page-title">Buy Me a Coffee</h1>
          <p className="page-content">
            If you enjoy The Ingredients and want to support its development, 
            consider buying me a coffee! ☕
          </p>
          <BuyMeACoffee />
        </div>
      </div>

      {isModalOpen && (
        <div className="coffee-modal-overlay" onClick={handleCloseModal}>
          <div className="coffee-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coffee-modal-header">
              <h2 className="coffee-modal-title">Local Coffee Shops</h2>
              <button 
                className="coffee-modal-close"
                onClick={handleCloseModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="coffee-modal-content">
              {isLoading && (
                <div className="coffee-modal-loading">
                  <p>Finding nearby coffee shops...</p>
                </div>
              )}
              {error && (
                <div className="coffee-modal-error">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && coffeeShops.length === 0 && (
                <div className="coffee-modal-empty">
                  <p>No coffee shops found nearby. Try expanding your search area.</p>
                </div>
              )}
              {!isLoading && !error && coffeeShops.length > 0 && (
                <ul className="coffee-shops-list">
                  {coffeeShops.map((shop) => (
                    <li 
                      key={shop.id} 
                      className="coffee-shop-item"
                      onClick={() => openInMaps(shop.lat, shop.lon, shop.name, formatAddress(shop))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openInMaps(shop.lat, shop.lon, shop.name, formatAddress(shop))
                        }
                      }}
                      aria-label={`Open ${shop.name} in maps`}
                    >
                      <div className="coffee-shop-name">{shop.name}</div>
                      <div className="coffee-shop-details">{formatAddress(shop)}</div>
                      {shop.tags?.phone && (
                        <div className="coffee-shop-details">📞 {shop.tags.phone}</div>
                      )}
                      {shop.distance !== undefined && (
                        <div className="coffee-shop-distance">
                          📍 {formatDistance(shop.distance)} away
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Coffee

