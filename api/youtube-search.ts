import type { VercelRequest, VercelResponse } from '@vercel/node'

interface YouTubeSearchRequest {
  query: string
}

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string
    }
    snippet: {
      title: string
      channelTitle: string
      thumbnails: {
        default: {
          url: string
        }
      }
    }
  }>
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { query }: YouTubeSearchRequest = req.body

    // Validate input
    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query is required' 
      })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      console.error('YOUTUBE_API_KEY environment variable not set')
      return res.status(500).json({ 
        error: 'YouTube API key not configured' 
      })
    }

    // Sanitize query
    const sanitizedQuery = query.trim().substring(0, 100)
    
    // Search YouTube using Data API v3
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=10&q=${encodeURIComponent(sanitizedQuery)}&key=${apiKey}`
    
    const response = await fetch(searchUrl)
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error('YouTube API error:', response.status, errorData)
      return res.status(response.status).json({ 
        error: 'Failed to search YouTube',
        message: response.status === 403 ? 'YouTube API quota exceeded or invalid key' : 'YouTube API error'
      })
    }

    const data: YouTubeSearchResponse = await response.json()

    // Format results
    const results = data.items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url
    }))

    return res.status(200).json({
      success: true,
      results
    })
  } catch (error) {
    console.error('Error searching YouTube:', error)
    return res.status(500).json({ 
      error: 'Failed to search YouTube',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

