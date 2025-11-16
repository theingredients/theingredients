import type { VercelRequest, VercelResponse } from '@vercel/node'
import { addApiCall } from './api-usage-tracker'
import { updateBudgetStatus } from './budget-alerts'

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

// Google Places API pricing (as of 2024)
// Nearby Search: $32 per 1000 requests
const GOOGLE_PLACES_COST_PER_1000 = 32
const COST_PER_REQUEST = GOOGLE_PLACES_COST_PER_1000 / 1000 // $0.032 per request

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
      // Track cached response (no cost)
      addApiCall('google-places', `nearbysearch/${searchType}`, true, clientIP)
      // Return cached response (don't count against rate limit)
      return res.status(200).json(cachedResponse)
    }

    // Google Places API Nearby Search endpoint
    // Support different search types: 'coffee' for coffee roasters, 'drinks' for tea/smoothies
    if (searchType === 'coffee') {
      // Single search for coffee - using "coffee" keyword to catch roasters and coffee shops
      // Frontend filtering will identify roasters from the results
      const coffeeUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=coffee&key=${process.env.GOOGLE_PLACES_API_KEY}`

      const googleResponse = await fetch(coffeeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text()
        console.error('Google Places API error:', errorText)
        return res.status(googleResponse.status).json({ 
          error: 'Failed to fetch from Google Places API',
          details: errorText
        })
      }

      const data = await googleResponse.json()

      // Check for API errors
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return res.status(400).json({ 
          error: `Google Places API error: ${data.status}`,
          message: data.error_message || 'Unknown error'
        })
      }

      // Track API call (1 call per coffee search)
      addApiCall('google-places', `nearbysearch/coffee`, false, clientIP)
      updateBudgetStatus(COST_PER_REQUEST)
      
      const allResults = data.results || []
      
      // Cache and return results
      const responseData = { 
        results: allResults
      }
      setCachedResponse(cacheKey, responseData)
      return res.status(200).json(responseData)
    } else {
      // Single search for drinks - using "beverage" or broader search without keyword
      // Frontend filtering will identify drink places from the results
      // Using type=cafe without keyword to get all cafes, then filter for drinks
      const drinksUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&key=${process.env.GOOGLE_PLACES_API_KEY}`

      const googleResponse = await fetch(drinksUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!googleResponse.ok) {
        const errorText = await googleResponse.text()
        console.error('Google Places API error:', errorText)
        return res.status(googleResponse.status).json({ 
          error: 'Failed to fetch from Google Places API',
          details: errorText
        })
      }

      const data = await googleResponse.json()

      // Check for API errors
      if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return res.status(400).json({ 
          error: `Google Places API error: ${data.status}`,
          message: data.error_message || 'Unknown error'
        })
      }

      // Track API call (1 call per drinks search)
      addApiCall('google-places', `nearbysearch/drinks`, false, clientIP)
      updateBudgetStatus(COST_PER_REQUEST)
      
      const allResults = data.results || []
      
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

