import type { VercelRequest, VercelResponse } from '@vercel/node'

// Rate limiting for Google Places API to control costs
// Track requests by IP address
interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (resets on cold start, but that's okay for cost control)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Response cache to reduce API calls (same location/radius/searchType = same results)
interface CacheEntry {
  data: any
  expiresAt: number
}

const responseCache = new Map<string, CacheEntry>()

// Rate limit configuration: 5 requests per IP per hour
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Cache configuration: Cache responses for 1 hour (same location likely has same results)
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

// Clean up old entries periodically (every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanupRateLimitStore() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }
  
  // Clean up rate limit store
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
  
  // Clean up expired cache entries
  for (const [key, entry] of responseCache.entries()) {
    if (now > entry.expiresAt) {
      responseCache.delete(key)
    }
  }
  
  lastCleanup = now
}

function getCacheKey(lat: number, lon: number, radius: number, searchType: string): string {
  // Round coordinates to ~100m precision to increase cache hits
  const roundedLat = Math.round(lat * 100) / 100
  const roundedLon = Math.round(lon * 100) / 100
  return `${roundedLat},${roundedLon},${radius},${searchType}`
}

function getCachedResponse(cacheKey: string): any | null {
  const entry = responseCache.get(cacheKey)
  if (!entry) {
    return null
  }
  
  const now = Date.now()
  if (now > entry.expiresAt) {
    responseCache.delete(cacheKey)
    return null
  }
  
  return entry.data
}

function setCachedResponse(cacheKey: string, data: any): void {
  const now = Date.now()
  responseCache.set(cacheKey, {
    data,
    expiresAt: now + CACHE_TTL_MS
  })
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  cleanupRateLimitStore()
  
  const now = Date.now()
  const entry = rateLimitStore.get(ip)
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    }
    rateLimitStore.set(ip, newEntry)
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime: newEntry.resetTime
    }
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment count
  entry.count++
  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime
  }
}

function getClientIP(req: VercelRequest): string {
  // Try to get real IP from various headers (Vercel, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded
    return ips.split(',')[0].trim()
  }
  
  const realIP = req.headers['x-real-ip']
  if (realIP) {
    return Array.isArray(realIP) ? realIP[0] : realIP
  }
  
  // Fallback to connection remote address
  return req.socket?.remoteAddress || 'unknown'
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting check
  const clientIP = getClientIP(req)
  const rateLimit = checkRateLimit(clientIP)
  
  if (!rateLimit.allowed) {
    const resetDate = new Date(rateLimit.resetTime)
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again after ${resetDate.toLocaleTimeString()}.`,
      retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) // seconds
    })
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString())
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString())
  res.setHeader('X-RateLimit-Reset', rateLimit.resetTime.toString())

  try {
    const { latitude, longitude, radius = 8047, searchType } = req.query

    // Validate required parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' })
    }

    // Validate coordinates
    const lat = parseFloat(latitude as string)
    const lon = parseFloat(longitude as string)
    
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' })
    }

    // Check if Google Places API key is configured
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({ 
        error: 'Google Places API is not configured. Please set GOOGLE_PLACES_API_KEY environment variable.' 
      })
    }

    // Convert radius from meters (Google Places API uses meters)
    const radiusMeters = Math.round(parseFloat(radius as string) || 8047)

    // Check cache first
    const cacheKey = getCacheKey(lat, lon, radiusMeters, searchType as string)
    const cachedResponse = getCachedResponse(cacheKey)
    if (cachedResponse) {
      // Return cached response (don't count against rate limit)
      return res.status(200).json(cachedResponse)
    }

    // Google Places API Nearby Search endpoint
    // Support different search types: 'coffee' for coffee roasters, 'drinks' for tea/smoothies
    if (searchType === 'coffee') {
      // Search for coffee roasters using multiple keyword searches
      // We'll do 2 searches: one for "roaster/roasting" and one for "coffee" to catch more results
      const roasterUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=roaster&key=${process.env.GOOGLE_PLACES_API_KEY}`
      const coffeeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=coffee&key=${process.env.GOOGLE_PLACES_API_KEY}`
      
      // Fetch both searches in parallel
      const [roasterResponse, coffeeResponse] = await Promise.allSettled([
        fetch(roasterUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch(coffeeUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      ])
      
      // Combine results from both searches
      const allResults: any[] = []
      const seenPlaceIds = new Set<string>()
      
      for (const response of [roasterResponse, coffeeResponse]) {
        if (response.status === 'fulfilled' && response.value.ok) {
          try {
            const data = await response.value.json()
            
            // Check for API errors in response
            if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
              console.warn('Google Places API error in search:', data.status, data.error_message)
              continue // Skip this search result
            }
            
            if (data.results && Array.isArray(data.results)) {
              for (const place of data.results) {
                if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                  seenPlaceIds.add(place.place_id)
                  allResults.push(place)
                }
              }
            }
          } catch (parseError) {
            console.warn('Error parsing Google Places response:', parseError)
            continue // Skip this search result
          }
        }
      }
      
      // Cache and return combined results
      const responseData = { 
        results: allResults
      }
      setCachedResponse(cacheKey, responseData)
      return res.status(200).json(responseData)
    } else {
      // Search for drinks: Reduced from 4 to 2 searches to save API calls
      // Combine tea+boba and smoothie+juice searches using broader keywords
      // Note: Google Places API doesn't support OR in keywords, so we use broader searches
      const teaBobaUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=tea&key=${process.env.GOOGLE_PLACES_API_KEY}`
      const smoothieJuiceUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=smoothie&key=${process.env.GOOGLE_PLACES_API_KEY}`
      
      // Fetch both searches in parallel (reduced from 4 to 2 API calls)
      const [teaBobaResponse, smoothieJuiceResponse] = await Promise.allSettled([
        fetch(teaBobaUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        fetch(smoothieJuiceUrl, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      ])
      
      // Combine results from both searches
      const allResults: any[] = []
      const seenPlaceIds = new Set<string>()
      
      for (const response of [teaBobaResponse, smoothieJuiceResponse]) {
        if (response.status === 'fulfilled' && response.value.ok) {
          try {
            const data = await response.value.json()
            
            // Check for API errors in response
            if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
              console.warn('Google Places API error in search:', data.status, data.error_message)
              continue // Skip this search result
            }
            
            if (data.results && Array.isArray(data.results)) {
              for (const place of data.results) {
                if (place.place_id && !seenPlaceIds.has(place.place_id)) {
                  seenPlaceIds.add(place.place_id)
                  allResults.push(place)
                }
              }
            }
          } catch (parseError) {
            console.warn('Error parsing Google Places response:', parseError)
            continue // Skip this search result
          }
        }
      }
      
      // Cache and return combined results
      const responseData = { 
        results: allResults
      }
      setCachedResponse(cacheKey, responseData)
      return res.status(200).json(responseData)
    }
  } catch (error) {
    console.error('Google Places search error:', error)
    
    // Return user-friendly error message
    if (error instanceof Error) {
      return res.status(500).json({ 
        error: error.message 
      })
    }
    
    return res.status(500).json({ 
      error: 'An error occurred while searching Google Places' 
    })
  }
}

