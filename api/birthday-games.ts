import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

interface WhichOnesFalseSubmission {
  playerName: string
  statements: string[]
  submittedAt: number
}

interface GOATSubmission {
  playerName: string
  movies: string[]
  submittedAt: number
}

// KV keys
const WHICH_ONES_FALSE_KEY = 'birthday-games:which-ones-false'
const GOAT_KEY = 'birthday-games:goat'

// Initialize Redis client (reused across requests)
let redisClient: ReturnType<typeof createClient> | null = null

// Get or create Redis client
async function getRedisClient() {
  if (!redisClient) {
    // Check for various possible Redis environment variable names
    // Different Redis providers (Vercel KV, Upstash, etc.) use different names
    const redisUrl = 
      process.env.KV_REST_API_URL || 
      process.env.REDIS_URL || 
      process.env.UPSTASH_REDIS_REST_URL ||
      process.env.REDIS_REST_URL
    
    const redisToken = 
      process.env.KV_REST_API_TOKEN || 
      process.env.REDIS_PASSWORD || 
      process.env.UPSTASH_REDIS_REST_TOKEN ||
      process.env.REDIS_REST_TOKEN
    
    if (redisUrl) {
      redisClient = createClient({
        url: redisUrl,
        ...(redisToken && { password: redisToken }),
      })
    } else {
      // Fallback: try to create client without explicit config
      // This might work if Redis is configured via other means
      console.warn('No Redis URL found in environment variables. Attempting default connection.')
      redisClient = createClient()
    }
    
    redisClient.on('error', (err) => console.error('Redis Client Error', err))
    
    if (!redisClient.isOpen) {
      await redisClient.connect()
    }
  }
  return redisClient
}

async function getSubmissions(): Promise<Record<string, WhichOnesFalseSubmission>> {
  try {
    const redis = await getRedisClient()
    const data = await redis.get(WHICH_ONES_FALSE_KEY)
    if (data) {
      return JSON.parse(data as string) as Record<string, WhichOnesFalseSubmission>
    }
    return {}
  } catch (error) {
    console.error('Error getting submissions from Redis:', error)
    // Return empty object if Redis fails
    return {}
  }
}

async function saveSubmission(playerName: string, statements: string[]): Promise<void> {
  try {
    const redis = await getRedisClient()
    const submissions = await getSubmissions()
    
    // Sanitize player name for key (remove special characters, limit length)
    const sanitizedName = playerName.trim().substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '')
    const key = sanitizedName.toLowerCase().replace(/\s+/g, '-')
    
    submissions[key] = {
      playerName: playerName.trim().substring(0, 50),
      statements: statements.map(s => s.trim().substring(0, 200)),
      submittedAt: Date.now()
    }
    
    await redis.set(WHICH_ONES_FALSE_KEY, JSON.stringify(submissions))
  } catch (error) {
    console.error('Error saving submission to Redis:', error)
    throw error
  }
}

async function getGOATSubmissions(): Promise<Record<string, GOATSubmission>> {
  try {
    const redis = await getRedisClient()
    const data = await redis.get(GOAT_KEY)
    if (data) {
      return JSON.parse(data as string) as Record<string, GOATSubmission>
    }
    return {}
  } catch (error) {
    console.error('Error getting GOAT submissions from Redis:', error)
    return {}
  }
}

async function saveGOATSubmission(playerName: string, movies: string[]): Promise<void> {
  try {
    const redis = await getRedisClient()
    const submissions = await getGOATSubmissions()
    
    // Sanitize player name for key (remove special characters, limit length)
    const sanitizedName = playerName.trim().substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '')
    const key = sanitizedName.toLowerCase().replace(/\s+/g, '-')
    
    submissions[key] = {
      playerName: playerName.trim().substring(0, 50),
      movies: movies.map(m => m.trim().substring(0, 200)),
      submittedAt: Date.now()
    }
    
    await redis.set(GOAT_KEY, JSON.stringify(submissions))
  } catch (error) {
    console.error('Error saving GOAT submission to Redis:', error)
    throw error
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  // POST: Submit statements or movies
  if (req.method === 'POST') {
    try {
      const { playerName, statements, movies, gameType } = req.body

      if (!playerName || !playerName.trim()) {
        return res.status(400).json({ error: 'Player name is required' })
      }

      // Handle GOAT game (movies)
      if (gameType === 'goat') {
        if (!movies || !Array.isArray(movies) || movies.length !== 3) {
          return res.status(400).json({ error: 'Three movies are required' })
        }

        // Validate all movies are non-empty
        if (movies.some(m => !m || !m.trim())) {
          return res.status(400).json({ error: 'All movies must be non-empty' })
        }

        await saveGOATSubmission(playerName, movies)
        const allSubmissions = await getGOATSubmissions()

        return res.status(200).json({
          success: true,
          submissions: allSubmissions
        })
      }

      // Handle Which One's False game (statements)
      if (!statements || !Array.isArray(statements) || statements.length !== 3) {
        return res.status(400).json({ error: 'Three statements are required' })
      }

      // Validate all statements are non-empty
      if (statements.some(s => !s || !s.trim())) {
        return res.status(400).json({ error: 'All statements must be non-empty' })
      }

      await saveSubmission(playerName, statements)
      const allSubmissions = await getSubmissions()

      return res.status(200).json({
        success: true,
        submissions: allSubmissions
      })
    } catch (error) {
      console.error('Error submitting:', error)
      return res.status(500).json({ 
        error: 'Failed to submit' 
      })
    }
  }

  // GET: Retrieve all submissions or songs
  if (req.method === 'GET') {
    try {
      const { gameType } = req.query

      // Handle GOAT game
      if (gameType === 'goat') {
        const submissions = await getGOATSubmissions()
        return res.status(200).json({ submissions })
      }

      // Default to Which One's False
      const submissions = await getSubmissions()
      return res.status(200).json({ submissions })
    } catch (error) {
      console.error('Error getting submissions:', error)
      return res.status(500).json({ 
        error: 'Failed to get submissions' 
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

