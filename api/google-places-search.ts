import type { VercelRequest, VercelResponse } from '@vercel/node'

// Rate limiting for Google Places API to control costs
// Track requests by IP address
interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (resets on cold start, but that's okay for cost control)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configuration: 5 requests per IP per hour
const RATE_LIMIT_MAX_REQUESTS = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

// Clean up old entries periodically (every 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanupRateLimitStore() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }
  
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(ip)
    }
  }
  
  lastCleanup = now
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

    // Google Places API Nearby Search endpoint
    // Support different search types: 'coffee' for coffee roasters, 'drinks' for tea/smoothies
    let googleUrl: string
    if (searchType === 'coffee') {
      // Search for coffee shops and cafes - we'll filter for roasters on frontend
      // Google Places API keyword search doesn't support OR, so we search broadly
      googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&keyword=coffee&key=${process.env.GOOGLE_PLACES_API_KEY}`
    } else {
      // Search for cafes (we'll filter for drinks on frontend)
      googleUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lon}&radius=${radiusMeters}&type=cafe&key=${process.env.GOOGLE_PLACES_API_KEY}`
    }

    const googleResponse = await fetch(googleUrl, {
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

    // Return the results array
    return res.status(200).json({ 
      results: data.results || []
    })
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

