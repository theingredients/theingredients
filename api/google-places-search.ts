import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

