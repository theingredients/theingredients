import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import BuyMeACoffee from '../components/BuyMeACoffee'
import { isValidCoordinates, sanitizeApiResponse } from '../utils/inputSanitizer'
import './PageStyles.css'
import './Coffee.css'

interface CoffeeRoaster {
  id: number
  name: string
  lat: number
  lon: number
  distance?: number
  source?: 'OSM' | 'Google' // Data source
  tags?: {
    'addr:street'?: string
    'addr:city'?: string
    'addr:housenumber'?: string
    'addr:postcode'?: string
    phone?: string
    website?: string
  }
}

interface DrinkPlace extends CoffeeRoaster {
  drinkTypes?: string[] // Array of drink types offered (tea, matcha, smoothies, etc.)
}

const Coffee = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coffeeRoasters, setCoffeeRoasters] = useState<CoffeeRoaster[]>([])
  const [drinkPlaces, setDrinkPlaces] = useState<DrinkPlace[]>([])
  const [searchMode, setSearchMode] = useState<'coffee' | 'drinks'>('coffee')

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
      // Convenience stores and gas stations
      '7-eleven',
      '7 eleven',
      '7eleven',
      'circle k',
      'circle-k',
      'speedway',
      'shell',
      'chevron',
      'exxon',
      'mobil',
      'bp',
      'arco',
      'valero',
      'phillips 66',
      'phillips66',
      'conoco',
      'texaco',
      'citgo',
      'sunoco',
      'wawa',
      'sheetz',
      'quikstop',
      'quick stop',
      'am/pm',
      'ampm',
      'casey\'s',
      'caseys',
      'kum & go',
      'kum and go',
      'kumgo',
      'pilot',
      'flying j',
      'flyingj',
      'love\'s',
      'loves',
      'ta',
      'travel centers',
      'truck stop',
    ]

    // Check if name or brand matches any corporate chain
    return corporateChains.some(chain => 
      nameLower.includes(chain) || brandLower.includes(chain)
    )
  }

  // Check if a place is a convenience store, gas station, or retail chain
  const isConvenienceStoreOrGasStation = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check OSM tags
    if (tags?.amenity === 'fuel' || tags?.amenity === 'gas_station' || 
        tags?.shop === 'convenience' || tags?.shop === 'gas' ||
        tags?.shop === 'fuel') {
      return true
    }
    
    // Check for convenience store/gas station keywords
    const convenienceKeywords = [
      'convenience store', 'gas station', 'gas station', 'fuel',
      'service station', 'truck stop', 'travel center', 'travel plaza',
      'mini mart', 'minimart', 'quick mart', 'quickmart'
    ]
    
    if (convenienceKeywords.some(keyword => nameLower.includes(keyword))) {
      return true
    }
    
    return false
  }

  // Check if a place is a bakery, patisserie, or pastry shop (not primarily drinks)
  const isBakeryOrPastryShop = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check OSM tags
    if (tags?.shop === 'bakery' || tags?.shop === 'pastry' || 
        tags?.craft === 'bakery' || tags?.craft === 'pastry') {
      return true
    }
    
    // Check for bakery/pastry keywords
    const bakeryKeywords = [
      'bakery', 'baker', 'patisserie', 'pâtisserie', 'pastry',
      'pastries', 'bake shop', 'bakeshop', 'confectionery',
      'confection', 'dessert', 'sweets', 'cake', 'cakes'
    ]
    
    // But exclude if it's a drink-focused place that happens to have bakery keywords
    // (e.g., "Tea & Pastry" should be included)
    if (bakeryKeywords.some(keyword => nameLower.includes(keyword))) {
      const drinkIndicators = ['tea', 'smoothie', 'juice', 'boba', 'matcha', 'chai', 'coffee']
      const hasDrinkIndicator = drinkIndicators.some(indicator => nameLower.includes(indicator))
      
      // If it has both bakery and drink keywords, it might be a tea house with pastries
      // Only exclude if it's clearly a bakery without drink focus
      if (!hasDrinkIndicator) {
        return true
      }
    }
    
    return false
  }

  // Check if a place is a restaurant
  const isRestaurant = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check for explicit restaurant tags
    if (tags?.amenity === 'restaurant' || tags?.amenity === 'food_court') {
      return true
    }
    
    // Check for restaurant-related keywords in name
    const restaurantKeywords = [
      'restaurant', 'diner', 'bistro', 'eatery', 'grill', 'steakhouse',
      'pizzeria', 'pizza', 'italian', 'mexican', 'chinese', 'japanese',
      'thai', 'indian', 'french', 'mediterranean', 'seafood', 'bbq',
      'barbecue', 'buffet', 'cafeteria', 'deli', 'sandwich',
      'burger', 'burgers', 'wings', 'sushi', 'ramen', 'noodles'
    ]
    
    // Don't exclude if it's a tea/smoothie place that happens to have a restaurant keyword
    // (e.g., "Smoothie Restaurant" would be excluded, but that's probably correct)
    if (restaurantKeywords.some(keyword => nameLower.includes(keyword))) {
      // But check if it's primarily a drink place first
      const drinkIndicators = ['tea', 'smoothie', 'juice', 'boba', 'matcha', 'chai']
      const hasDrinkIndicator = drinkIndicators.some(indicator => nameLower.includes(indicator))
      
      // If it has both restaurant and drink keywords, prioritize drink keywords
      // (e.g., "Tea House Restaurant" should be included)
      if (!hasDrinkIndicator) {
        return true
      }
    }
    
    // Check cuisine tags - if it has a cuisine tag that's not drink-related, it's likely a restaurant
    if (tags?.cuisine) {
      const cuisine = tags.cuisine.toLowerCase()
      // Exclude tea-related cuisines, but include others (likely restaurants)
      if (cuisine !== 'tea' && cuisine !== 'bubble_tea' && cuisine !== 'bubble tea') {
        return true
      }
    }
    
    return false
  }

  // Check if a place serves alcohol
  const isAlcoholic = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check for explicit alcohol tags
    if (tags?.amenity === 'bar' || tags?.amenity === 'pub' || tags?.amenity === 'nightclub') {
      return true
    }
    
    if (tags?.shop === 'alcohol' || tags?.shop === 'wine' || tags?.shop === 'beverages') {
      // Check if it's specifically a beverage shop that might be non-alcoholic
      // But if it's tagged as wine/alcohol shop, exclude it
      if (tags?.shop === 'wine' || tags?.shop === 'alcohol') {
        return true
      }
    }
    
    // Check for alcohol-related keywords in name
    const alcoholKeywords = [
      'bar', 'pub', 'tavern', 'brewery', 'brew', 'wine', 'spirits', 
      'liquor', 'cocktail', 'beer', 'distillery', 'winery', 'bottleshop',
      'bottle shop', 'alcohol', 'ale house', 'taproom', 'saloon'
    ]
    
    if (alcoholKeywords.some(keyword => nameLower.includes(keyword))) {
      return true
    }
    
    // Check for craft brewery (usually beer-focused)
    if (tags?.craft === 'brewery' || tags?.microbrewery === 'yes') {
      return true
    }
    
    return false
  }

  // Detect what specific drinks a place offers
  const detectDrinkTypes = (name: string, tags: any): string[] => {
    const nameLower = name.toLowerCase()
    const drinkTypes: string[] = []
    
    // Define drink keywords and their display names
    const drinkKeywords: { [key: string]: string } = {
      'tea': 'Tea',
      'matcha': 'Matcha',
      'chai': 'Chai',
      'bubble tea': 'Bubble Tea',
      'boba': 'Boba',
      'smoothie': 'Smoothies',
      'smoothies': 'Smoothies',
      'juice': 'Juice',
      'juices': 'Juice',
      'fresh juice': 'Fresh Juice',
      'fruit juice': 'Fruit Juice',
      'fresh pressed': 'Fresh Pressed',
      'cold press': 'Cold Press',
      'acai': 'Acai',
      'tapioca': 'Tapioca',
      'herbal tea': 'Herbal Tea',
      'iced tea': 'Iced Tea',
      'green tea': 'Green Tea',
      'black tea': 'Black Tea',
      'oolong': 'Oolong',
      'white tea': 'White Tea',
      'rooibos': 'Rooibos',
      'yerba mate': 'Yerba Mate',
      'mate': 'Yerba Mate',
      'kombucha': 'Kombucha',
      'lemonade': 'Lemonade',
      'iced coffee': 'Iced Coffee',
      'cold brew': 'Cold Brew',
      'frappe': 'Frappe',
      'milkshake': 'Milkshake',
      'shake': 'Shake',
    }
    
    // Check name for drink keywords
    for (const [keyword, displayName] of Object.entries(drinkKeywords)) {
      if (nameLower.includes(keyword) && !drinkTypes.includes(displayName)) {
        drinkTypes.push(displayName)
      }
    }
    
    // Check OSM tags
    if (tags?.shop === 'tea') {
      if (!drinkTypes.includes('Tea')) {
        drinkTypes.push('Tea')
      }
    }
    
    if (tags?.cuisine) {
      const cuisine = tags.cuisine.toLowerCase()
      if (cuisine.includes('tea') && !drinkTypes.includes('Tea')) {
        drinkTypes.push('Tea')
      }
      if (cuisine.includes('bubble_tea') || cuisine.includes('bubble tea')) {
        if (!drinkTypes.includes('Bubble Tea')) {
          drinkTypes.push('Bubble Tea')
        }
      }
    }
    
    // If no specific drinks found but it's a cafe/beverage shop, add generic
    if (drinkTypes.length === 0 && (tags?.amenity === 'cafe' || tags?.shop === 'beverages')) {
      drinkTypes.push('Beverages')
    }
    
    return drinkTypes
  }

  // Check if a place is a coffee shop
  const isCoffeeShop = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check for explicit coffee shop tags
    if (tags?.shop === 'coffee' || tags?.craft === 'coffee_roaster' || 
        tags?.roaster === 'yes' || tags?.amenity === 'cafe' && tags?.cuisine === 'coffee_shop') {
      return true
    }
    
    // Check for coffee-related keywords in name
    const coffeeKeywords = [
      'coffee', 'coffee shop', 'coffeehouse', 'coffee house', 'café', 'cafe',
      'espresso', 'latte', 'cappuccino', 'roaster', 'roasting', 'roasted',
      'coffee roaster', 'coffee bar', 'coffee company'
    ]
    
    if (coffeeKeywords.some(keyword => nameLower.includes(keyword))) {
      return true
    }
    
    return false
  }

  // Check if a place serves tea, smoothies, or other non-alcoholic drinks
  // Must strictly sell drinks, not restaurants, coffee shops, or general cafes
  const isDrinkPlace = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Exclude restaurants first
    if (isRestaurant(name, tags)) {
      return false
    }
    
    // Exclude coffee shops
    if (isCoffeeShop(name, tags)) {
      return false
    }
    
    // Exclude alcohol-serving places
    if (isAlcoholic(name, tags)) {
      return false
    }
    
    // Exclude convenience stores and gas stations
    if (isConvenienceStoreOrGasStation(name, tags)) {
      return false
    }
    
    // Exclude bakeries and patisseries (unless they're clearly drink-focused)
    if (isBakeryOrPastryShop(name, tags)) {
      return false
    }
    
    // Check for explicit tea/smoothie/juice shop tags - always include these
    if (tags?.shop === 'tea' || tags?.shop === 'beverages') {
      return true
    }
    
    // Check for drink-specific keywords in name (indicating drinks are primary focus)
    // Expanded list to catch more variations and business names
    const drinkKeywords = [
      'tea', 'smoothie', 'smoothies', 'juice', 'juices', 'bubble tea',
      'boba', 'matcha', 'chai', 'iced tea', 'herbal tea', 'tapioca',
      'acai', 'fresh juice', 'fruit juice', 'fresh pressed', 'cold press',
      'juice bar', 'smoothie bar', 'tea house', 'tea shop', 'tea room',
      'tea lounge', 'tea cafe', 'bubble tea', 'boba tea', 'matcha bar',
      'smoothie shop', 'juice shop', 'juice bar', 'kombucha', 'lemonade',
      'frappe', 'milkshake', 'shake', 'smoothie bowl', 'acai bowl',
      'tropical', 'fresh', 'blend', 'blenders', 'squeeze', 'press', 'pressed',
      'cold brew', 'juicery', 'tropical smoothie', 'jamba', 'planet smoothie', 
      'smoothie king', 'naked juice', 'odwalla', 'bolthouse', 'innocent',
      'grass', 'in the grass', 'blenders in', 'pressed juice', 'juice press'
    ]
    
    // If name contains drink keywords, include it (even if it's a cafe)
    if (drinkKeywords.some(keyword => nameLower.includes(keyword))) {
      return true
    }
    
    // Check cuisine tags for tea-specific cuisines
    if (tags?.cuisine) {
      const cuisine = tags.cuisine.toLowerCase()
      if (cuisine === 'tea' || cuisine === 'bubble_tea' || cuisine === 'bubble tea') {
        return true
      }
    }
    
    // For cafes and fast_food places, be MORE STRICT - only include if clearly drink-focused
    // Many cafes are general food places, not drink-focused
    if (tags?.amenity === 'cafe' || tags?.amenity === 'fast_food') {
      // Check if cafe has explicit drink-related tags
      if (tags?.drink_tea === 'yes' || tags?.drink_smoothie === 'yes' || 
          tags?.drink_juice === 'yes' || tags?.drink_bubble_tea === 'yes') {
        return true
      }
      
      // If cafe/fast_food name suggests it's drink-focused, include it
      const cafeDrinkIndicators = [
        'tea', 'smoothie', 'juice', 'boba', 'matcha', 'chai', 'bubble',
        'tropical', 'fresh', 'blend', 'blenders', 'squeeze', 'press', 'pressed',
        'juicery', 'smoothie bowl', 'acai', 'tropical smoothie', 'grass',
        'in the grass', 'blenders in', 'pressed juice', 'juice press'
      ]
      if (cafeDrinkIndicators.some(indicator => nameLower.includes(indicator))) {
        return true
      }
      
      // Don't include generic cafes without clear drink indicators
      // This prevents places like "Cat Therapy" or generic cafes from showing up
      return false
    }
    
    return false
  }

  // Fetch tea, smoothies, and other drinks from OSM Overpass API and Google Places API
  const fetchDrinkPlaces = async (lat: number, lon: number) => {
    try {
      setIsLoading(true)
      setError(null)

      if (!isValidCoordinates(lat, lon)) {
        throw new Error('Invalid coordinates')
      }

      // Search radius in meters (5 miles = approximately 8047 meters)
      const radius = 8047

      // Fetch from both OSM and Google Places in parallel
      const [osmResults, googleResults] = await Promise.allSettled([
        fetchOSMPlaces(lat, lon, radius),
        fetchGooglePlaces(lat, lon, radius)
      ])

      // Process OSM results
      let osmPlaces: DrinkPlace[] = []
      if (osmResults.status === 'fulfilled') {
        osmPlaces = osmResults.value
      } else {
        console.warn('OSM search failed:', osmResults.reason)
      }

      // Process Google Places results
      let googlePlaces: DrinkPlace[] = []
      if (googleResults.status === 'fulfilled') {
        googlePlaces = googleResults.value
      } else {
        console.warn('Google Places search failed:', googleResults.reason)
      }

      // Combine and deduplicate results
      const allPlaces = [...osmPlaces, ...googlePlaces]
      const uniquePlaces = deduplicatePlaces(allPlaces)

      // Sort by distance and limit to top 20
      const sortedPlaces = uniquePlaces
        .sort((a: DrinkPlace, b: DrinkPlace) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20)

      setDrinkPlaces(sortedPlaces)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to fetch drink places')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch places from OSM
  const fetchOSMPlaces = async (lat: number, lon: number, radius: number): Promise<DrinkPlace[]> => {
    // Overpass API query to find tea shops, beverage shops, cafes, and fast food
    // We'll filter to only include drink-focused ones in processing
    // Cast a wider net to catch places that might be tagged differently
    const query = `
      [out:json][timeout:25];
      (
        node["shop"="tea"](around:${radius},${lat},${lon});
        node["shop"="beverages"](around:${radius},${lat},${lon});
        node["amenity"="cafe"](around:${radius},${lat},${lon});
        node["amenity"="fast_food"](around:${radius},${lat},${lon});
        node["amenity"="food_court"](around:${radius},${lat},${lon});
        way["shop"="tea"](around:${radius},${lat},${lon});
        way["shop"="beverages"](around:${radius},${lat},${lon});
        way["amenity"="cafe"](around:${radius},${lat},${lon});
        way["amenity"="fast_food"](around:${radius},${lat},${lon});
        way["amenity"="food_court"](around:${radius},${lat},${lon});
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
      throw new Error('Failed to fetch from OSM')
    }

    const data = await response.json()

    if (!data.elements || !Array.isArray(data.elements)) {
      throw new Error('Invalid response from OSM API')
    }

    // Process results - filter for tea, smoothies, and drinks (exclude alcohol)
    const places: DrinkPlace[] = data.elements
        .map((element: any, index: number) => {
          const center = element.center || { lat: element.lat, lon: element.lon }
          
          if (!center.lat || !center.lon) {
            return null
          }

          const name = sanitizeApiResponse(
            element.tags?.name || 
            element.tags?.['addr:housenumber'] || 
            '',
            100
          )

          // Skip places with no name or "Unnamed" in the name
          if (!name || name.toLowerCase().includes('unnamed')) {
            return null
          }

          const brand = sanitizeApiResponse(element.tags?.brand, 100)

          // Filter out corporate chains (same as coffee)
          if (isCorporateChain(name, brand)) {
            return null
          }

          // Filter out convenience stores and gas stations
          if (isConvenienceStoreOrGasStation(name, element.tags)) {
            return null
          }

          // Filter out restaurants (must strictly sell drinks, not food)
          if (isRestaurant(name, element.tags)) {
            return null
          }

          // Filter out coffee shops (we're looking for non-coffee drinks)
          if (isCoffeeShop(name, element.tags)) {
            return null
          }

          // Filter out alcohol
          if (isAlcoholic(name, element.tags)) {
            return null
          }

          // Filter out bakeries and patisseries
          if (isBakeryOrPastryShop(name, element.tags)) {
            return null
          }

          // Filter for tea, smoothies, and other drinks (strict check)
          if (!isDrinkPlace(name, element.tags)) {
            return null
          }

          const distance = calculateDistance(lat, lon, center.lat, center.lon)
          
          // Detect what drinks this place offers
          const drinkTypes = detectDrinkTypes(name, element.tags)

          return {
            id: element.id || index,
            name,
            lat: center.lat,
            lon: center.lon,
            distance,
            source: 'OSM',
            drinkTypes,
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
        .filter((place: DrinkPlace | null): place is DrinkPlace => place !== null)

    return places
  }

  // Fetch places from Google Places API
  const fetchGooglePlaces = async (lat: number, lon: number, radius: number): Promise<DrinkPlace[]> => {
    try {
      const response = await fetch(
        `/api/google-places-search?latitude=${lat}&longitude=${lon}&radius=${radius}&searchType=drinks`
      )

      if (!response.ok) {
        // If Google Places API is not configured, return empty array (don't fail the whole search)
        if (response.status === 500) {
          return []
        }
        // Handle rate limiting gracefully - still return OSM results
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}))
          console.warn('Google Places API rate limit reached:', errorData.message || 'Too many requests')
          // Return empty array so OSM results still show
          return []
        }
        throw new Error('Failed to fetch from Google Places')
      }

      const data = await response.json()
      const places = data.results || []

      // Convert Google Places results to DrinkPlace format
      const drinkPlaces: DrinkPlace[] = places
        .map((place: any) => {
          const name = sanitizeApiResponse(place.name || '', 100)
          
          // Skip places with no name or "Unnamed" in the name
          if (!name || name.toLowerCase().includes('unnamed')) {
            return null
          }

          // Filter out corporate chains
          const brand = sanitizeApiResponse(place.name, 100)
          if (isCorporateChain(name, brand)) {
            return null
          }

          // Filter out convenience stores and gas stations
          if (isConvenienceStoreOrGasStation(name, { types: place.types })) {
            return null
          }

          // Filter out coffee shops
          if (isCoffeeShop(name, { types: place.types })) {
            return null
          }

          // Filter out restaurants
          if (isRestaurant(name, { types: place.types })) {
            return null
          }

          // Filter out alcohol-serving places
          if (isAlcoholic(name, { types: place.types })) {
            return null
          }

          // Filter out bakeries and patisseries
          if (isBakeryOrPastryShop(name, { types: place.types })) {
            return null
          }

          // Check Google Places types - filter for drink-related types
          const types = (place.types || []).map((type: string) => type.toLowerCase())
          const hasDrinkType = types.includes('cafe') || types.includes('food') || 
                              types.includes('meal_takeaway') || types.includes('restaurant')
          
          // Check if it's a drink place by name or type
          if (!hasDrinkType && !isDrinkPlace(name, { types: place.types })) {
            return null
          }

          const location = place.geometry?.location || {}
          const placeLat = location.lat || 0
          const placeLon = location.lng || 0
          
          const distance = calculateDistance(lat, lon, placeLat, placeLon)

          // Format address from Google Places data
          const addressComponents = place.address_components || []
          const streetNumber = addressComponents.find((comp: any) => comp.types.includes('street_number'))?.long_name || ''
          const route = addressComponents.find((comp: any) => comp.types.includes('route'))?.long_name || ''
          const city = addressComponents.find((comp: any) => comp.types.includes('locality'))?.long_name || ''
          const postalCode = addressComponents.find((comp: any) => comp.types.includes('postal_code'))?.long_name || ''

          return {
            id: place.place_id || `google-${place.name}`,
            name,
            lat: placeLat,
            lon: placeLon,
            distance,
            source: 'Google',
            drinkTypes: detectDrinkTypes(name, { types: place.types }),
            tags: {
              'addr:street': sanitizeApiResponse(route, 100),
              'addr:city': sanitizeApiResponse(city, 100),
              'addr:housenumber': sanitizeApiResponse(streetNumber, 20),
              'addr:postcode': sanitizeApiResponse(postalCode, 20),
              phone: sanitizeApiResponse(place.formatted_phone_number || place.international_phone_number, 50),
              website: sanitizeApiResponse(place.website, 200),
            },
          }
        })
        .filter((place: DrinkPlace | null): place is DrinkPlace => place !== null)

      return drinkPlaces
    } catch (err) {
      console.error('Google Places API error:', err)
      // Return empty array if Google Places fails (don't break the whole search)
      return []
    }
  }

  // Deduplicate places by name and location (within 100m)
  const deduplicatePlaces = (places: DrinkPlace[]): DrinkPlace[] => {
    const seen = new Map<string, DrinkPlace>()
    
    for (const place of places) {
      const key = place.name.toLowerCase().trim()
      const existing = seen.get(key)
      
      if (!existing) {
        seen.set(key, place)
      } else {
      // If we have a duplicate, prefer the one with more complete data
      // (Google Places usually has better data than OSM)
      if (place.tags?.phone && !existing.tags?.phone) {
        seen.set(key, place)
      } else if (place.tags?.website && !existing.tags?.website) {
        seen.set(key, place)
      }
      }
    }
    
    return Array.from(seen.values())
  }

  // Handle "Don't like coffee" button click - request geolocation and search for drinks
  const handleDontLikeCoffee = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsModalOpen(true)
      setSearchMode('drinks')
      return
    }

    setIsModalOpen(true)
    setIsLoading(true)
    setError(null)
    setDrinkPlaces([])
    setSearchMode('drinks')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (!isValidCoordinates(latitude, longitude)) {
          setError('Invalid geolocation coordinates received')
          setIsLoading(false)
          return
        }

        fetchDrinkPlaces(latitude, longitude)
      },
      (err) => {
        setIsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please enable location permissions to find nearby drink places.')
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('Location unavailable. Please try again.')
        } else {
          setError('Location timeout. Please try again.')
        }
      },
      { timeout: 10000 }
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

  // Check if a place is a coffee roaster
  const isCoffeeRoaster = (name: string, tags: any): boolean => {
    const nameLower = name.toLowerCase()
    
    // Check for explicit roaster tags
    if (tags?.craft === 'coffee_roaster' || tags?.roaster === 'yes') {
      return true
    }
    
    // Google Places types might include cafe, food, store - we check name for roaster keywords
    
    // Check if name contains roaster-related keywords
    const roasterKeywords = ['roaster', 'roasting', 'roast', 'roasted']
    if (roasterKeywords.some(keyword => nameLower.includes(keyword))) {
      return true
    }
    
    // Check for other indicators
    if (tags?.roaster === 'coffee' || tags?.['roaster:type'] === 'coffee') {
      return true
    }
    
    return false
  }

  // Fetch coffee roasters from OSM Overpass API and Google Places API
  const fetchCoffeeRoasters = async (lat: number, lon: number) => {
    try {
      setIsLoading(true)
      setError(null)

      // Validate coordinates
      if (!isValidCoordinates(lat, lon)) {
        throw new Error('Invalid coordinates')
      }

      // Search radius in meters (5 miles = approximately 8047 meters)
      const radius = 8047

      // Fetch from both OSM and Google Places in parallel
      const [osmResults, googleResults] = await Promise.allSettled([
        fetchOSMCoffeeRoasters(lat, lon, radius),
        fetchGoogleCoffeeRoasters(lat, lon, radius)
      ])

      // Process OSM results
      let osmRoasters: CoffeeRoaster[] = []
      if (osmResults.status === 'fulfilled') {
        osmRoasters = osmResults.value
      } else {
        console.warn('OSM search failed:', osmResults.reason)
      }

      // Process Google Places results
      let googleRoasters: CoffeeRoaster[] = []
      if (googleResults.status === 'fulfilled') {
        googleRoasters = googleResults.value
      } else {
        console.warn('Google Places search failed:', googleResults.reason)
      }

      // Combine and deduplicate results
      const allRoasters = [...osmRoasters, ...googleRoasters]
      const uniqueRoasters = deduplicateCoffeeRoasters(allRoasters)

      // Sort by distance and limit to top 20
      const sortedRoasters = uniqueRoasters
        .sort((a: CoffeeRoaster, b: CoffeeRoaster) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 20)

      setCoffeeRoasters(sortedRoasters)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Unable to fetch coffee roasters')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch coffee roasters from OSM
  const fetchOSMCoffeeRoasters = async (lat: number, lon: number, radius: number): Promise<CoffeeRoaster[]> => {
    // Overpass API query to find coffee shops and cafes first
    // Then we'll filter for roasters in the processing step
    // This catches roasters that might be tagged as coffee shops
    const query = `
      [out:json][timeout:25];
      (
        node["craft"="coffee_roaster"](around:${radius},${lat},${lon});
        node["roaster"="yes"](around:${radius},${lat},${lon});
        node["shop"="coffee"](around:${radius},${lat},${lon});
        node["amenity"="cafe"](around:${radius},${lat},${lon});
        way["craft"="coffee_roaster"](around:${radius},${lat},${lon});
        way["roaster"="yes"](around:${radius},${lat},${lon});
        way["shop"="coffee"](around:${radius},${lat},${lon});
        way["amenity"="cafe"](around:${radius},${lat},${lon});
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
      throw new Error('Failed to fetch from OSM')
    }

    const data = await response.json()

    if (!data.elements || !Array.isArray(data.elements)) {
      throw new Error('Invalid response from OSM API')
    }

    // Process results - filter for roasters
    const roasters: CoffeeRoaster[] = data.elements
        .map((element: any, index: number) => {
          const center = element.center || { lat: element.lat, lon: element.lon }
          
          if (!center.lat || !center.lon) {
            return null
          }

              const name = sanitizeApiResponse(
                element.tags?.name || 
                element.tags?.['addr:housenumber'] || 
                '',
                100
              )

              // Skip places with no name or "Unnamed" in the name
              if (!name || name.toLowerCase().includes('unnamed')) {
                return null
              }

              const brand = sanitizeApiResponse(element.tags?.brand, 100)

              // Filter out corporate chains
              if (isCorporateChain(name, brand)) {
                return null
              }

              // Filter out convenience stores and gas stations
              if (isConvenienceStoreOrGasStation(name, element.tags)) {
                return null
              }

              // Filter for coffee roasters only
              if (!isCoffeeRoaster(name, element.tags)) {
                return null
              }

          const distance = calculateDistance(lat, lon, center.lat, center.lon)

          return {
            id: element.id || index,
            name,
            lat: center.lat,
            lon: center.lon,
            distance,
            source: 'OSM',
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
        .filter((roaster: CoffeeRoaster | null): roaster is CoffeeRoaster => roaster !== null)

    return roasters
  }

  // Fetch coffee roasters from Google Places API
  const fetchGoogleCoffeeRoasters = async (lat: number, lon: number, radius: number): Promise<CoffeeRoaster[]> => {
    try {
      const response = await fetch(
        `/api/google-places-search?latitude=${lat}&longitude=${lon}&radius=${radius}&searchType=coffee`
      )

      if (!response.ok) {
        // If Google Places API is not configured, return empty array (don't fail the whole search)
        if (response.status === 500) {
          return []
        }
        // Handle rate limiting gracefully - still return OSM results
        if (response.status === 429) {
          const errorData = await response.json().catch(() => ({}))
          console.warn('Google Places API rate limit reached:', errorData.message || 'Too many requests')
          // Return empty array so OSM results still show
          return []
        }
        throw new Error('Failed to fetch from Google Places')
      }

      const data = await response.json()
      const places = data.results || []

          // Convert Google Places results to CoffeeRoaster format
          const roasters: CoffeeRoaster[] = places
            .map((place: any) => {
              const name = sanitizeApiResponse(place.name || '', 100)
              
              // Skip places with no name or "Unnamed" in the name
              if (!name || name.toLowerCase().includes('unnamed')) {
                return null
              }

              // Filter out corporate chains
              const brand = sanitizeApiResponse(place.name, 100)
              if (isCorporateChain(name, brand)) {
                return null
              }

              // Filter out convenience stores and gas stations
              if (isConvenienceStoreOrGasStation(name, { types: place.types })) {
                return null
              }

              // Filter for coffee roasters only
              if (!isCoffeeRoaster(name, { types: place.types })) {
                return null
              }

          const location = place.geometry?.location || {}
          const placeLat = location.lat || 0
          const placeLon = location.lng || 0
          
          const distance = calculateDistance(lat, lon, placeLat, placeLon)

          // Format address from Google Places data
          const addressComponents = place.address_components || []
          const streetNumber = addressComponents.find((comp: any) => comp.types.includes('street_number'))?.long_name || ''
          const route = addressComponents.find((comp: any) => comp.types.includes('route'))?.long_name || ''
          const city = addressComponents.find((comp: any) => comp.types.includes('locality'))?.long_name || ''
          const postalCode = addressComponents.find((comp: any) => comp.types.includes('postal_code'))?.long_name || ''

          return {
            id: place.place_id || `google-${place.name}`,
            name,
            lat: placeLat,
            lon: placeLon,
            distance,
            source: 'Google',
            tags: {
              'addr:street': sanitizeApiResponse(route, 100),
              'addr:city': sanitizeApiResponse(city, 100),
              'addr:housenumber': sanitizeApiResponse(streetNumber, 20),
              'addr:postcode': sanitizeApiResponse(postalCode, 20),
              phone: sanitizeApiResponse(place.formatted_phone_number || place.international_phone_number, 50),
              website: sanitizeApiResponse(place.website, 200),
            },
          }
        })
        .filter((roaster: CoffeeRoaster | null): roaster is CoffeeRoaster => roaster !== null)

      return roasters
    } catch (err) {
      console.error('Google Places API error:', err)
      // Return empty array if Google Places fails (don't break the whole search)
      return []
    }
  }

  // Deduplicate coffee roasters by name
  const deduplicateCoffeeRoasters = (roasters: CoffeeRoaster[]): CoffeeRoaster[] => {
    const seen = new Map<string, CoffeeRoaster>()
    
    for (const roaster of roasters) {
      const key = roaster.name.toLowerCase().trim()
      const existing = seen.get(key)
      
      if (!existing) {
        seen.set(key, roaster)
      } else {
        // If we have a duplicate, prefer the one with more complete data
        // (Google Places usually has better data than OSM)
        if (roaster.tags?.phone && !existing.tags?.phone) {
          seen.set(key, roaster)
        } else if (roaster.tags?.website && !existing.tags?.website) {
          seen.set(key, roaster)
        }
      }
    }
    
    return Array.from(seen.values())
  }

  // Handle button click - request geolocation
  const handleFindCoffeeRoasters = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsModalOpen(true)
      setSearchMode('coffee')
      return
    }

    setIsModalOpen(true)
    setIsLoading(true)
    setError(null)
    setCoffeeRoasters([])
    setSearchMode('coffee')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        
        if (!isValidCoordinates(latitude, longitude)) {
          setError('Invalid geolocation coordinates received')
          setIsLoading(false)
          return
        }

        fetchCoffeeRoasters(latitude, longitude)
      },
      (err) => {
        setIsLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access denied. Please enable location permissions to find nearby coffee roasters.')
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
    setCoffeeRoasters([])
    setDrinkPlaces([])
    setSearchMode('coffee')
  }

  // Format address from tags
  const formatAddress = (place: CoffeeRoaster | DrinkPlace): string => {
    const parts: string[] = []
    if (place.tags?.['addr:housenumber']) {
      parts.push(place.tags['addr:housenumber'])
    }
    if (place.tags?.['addr:street']) {
      parts.push(place.tags['addr:street'])
    }
    if (place.tags?.['addr:city']) {
      parts.push(place.tags['addr:city'])
    }
    if (place.tags?.['addr:postcode']) {
      parts.push(place.tags['addr:postcode'])
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
          <h1 className="page-title">Find Local Coffee Roasters!</h1>
          <button 
            className="email-button coffee-section-button"
            onClick={handleFindCoffeeRoasters}
          >
            Find Nearby!
          </button>

          <button 
            className="email-button coffee-section-button"
            onClick={handleDontLikeCoffee}
          >
            But I don't like coffee!
          </button>
        </div>
        <div className="coffee-section coffee-section-small">
          <h1 className="coffee-section-small-title">Buy Me a Coffee</h1>
          <p className="coffee-section-small-content">
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
              <div>
                <h2 className="coffee-modal-title">
                  {searchMode === 'coffee' ? 'Local Coffee Roasters' : 'Tea, Smoothies & Drinks'}
                </h2>
                <p className="coffee-modal-subtitle">Searching within 5 miles</p>
              </div>
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
                  <p>
                    {searchMode === 'coffee' 
                      ? 'Finding nearby coffee roasters...' 
                      : 'Finding nearby tea, smoothies & drinks...'}
                  </p>
                </div>
              )}
              {error && (
                <div className="coffee-modal-error">
                  <p>{error}</p>
                </div>
              )}
              {!isLoading && !error && searchMode === 'coffee' && coffeeRoasters.length === 0 && (
                <div className="coffee-modal-empty">
                  <p>No coffee roasters found nearby. Try expanding your search area.</p>
                </div>
              )}
              {!isLoading && !error && searchMode === 'drinks' && drinkPlaces.length === 0 && (
                <div className="coffee-modal-empty">
                  <p>No drink places found nearby. Try expanding your search area.</p>
                </div>
              )}
              {!isLoading && !error && searchMode === 'coffee' && coffeeRoasters.length > 0 && (
                <ul className="coffee-shops-list">
                  {coffeeRoasters.map((roaster) => (
                    <li 
                      key={roaster.id} 
                      className="coffee-shop-item"
                      onClick={() => openInMaps(roaster.lat, roaster.lon, roaster.name, formatAddress(roaster))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openInMaps(roaster.lat, roaster.lon, roaster.name, formatAddress(roaster))
                        }
                      }}
                      aria-label={`Open ${roaster.name} in maps`}
                    >
                      <div className="coffee-shop-name">{roaster.name}</div>
                      <div className="coffee-shop-address">{formatAddress(roaster)}</div>
                      {roaster.tags?.phone && (
                        <div className="coffee-shop-phone">
                          {roaster.tags.phone.split(';').map((phone, idx) => (
                            <div key={idx} className="coffee-shop-phone-number">
                              📞 {phone.trim()}
                            </div>
                          ))}
                        </div>
                      )}
                      {roaster.distance !== undefined && (
                        <div className="coffee-shop-distance">
                          📍 {formatDistance(roaster.distance)} away
                        </div>
                      )}
                      {roaster.source && (
                        <div className="coffee-shop-source">
                          {roaster.source === 'OSM' ? '🗺️ OSM' : '🔍 Google'}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {!isLoading && !error && searchMode === 'drinks' && drinkPlaces.length > 0 && (
                <ul className="coffee-shops-list">
                  {drinkPlaces.map((place) => (
                    <li 
                      key={place.id} 
                      className="coffee-shop-item"
                      onClick={() => openInMaps(place.lat, place.lon, place.name, formatAddress(place))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          openInMaps(place.lat, place.lon, place.name, formatAddress(place))
                        }
                      }}
                      aria-label={`Open ${place.name} in maps`}
                    >
                      <div className="coffee-shop-name">{place.name}</div>
                      <div className="coffee-shop-address">{formatAddress(place)}</div>
                      {place.tags?.phone && (
                        <div className="coffee-shop-phone">
                          {place.tags.phone.split(';').map((phone, idx) => (
                            <div key={idx} className="coffee-shop-phone-number">
                              📞 {phone.trim()}
                            </div>
                          ))}
                        </div>
                      )}
                      {place.distance !== undefined && (
                        <div className="coffee-shop-distance">
                          📍 {formatDistance(place.distance)} away
                        </div>
                      )}
                      {place.source && (
                        <div className="coffee-shop-source">
                          {place.source === 'OSM' ? '🗺️ OSM' : '🔍 Google'}
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

