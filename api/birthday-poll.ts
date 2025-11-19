import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

interface Restaurant {
  id: string
  name: string
  description?: string
  votes: number
  voters: string[] // Array of voter names with guest counts
  link?: string
}

interface VoteData {
  restaurants: Restaurant[]
  lastUpdated: number
}

interface VoteRequest {
  restaurantId: string
  name: string
  guestCount?: number
  comment?: string
}

interface CommentRequest {
  name: string
  comment: string
}

// Default poll data structure
const DEFAULT_POLL_DATA: VoteData = {
  restaurants: [
    { id: '1', name: `Arnoldi's`, description: 'Italian cuisine', votes: 0, voters: [], link: 'https://www.arnoldis.com/' },
    { id: '2', name: 'La Paloma', description: 'Mexican cuisine', votes: 0, voters: [], link: 'https://lapalomasb.com/' },
    { id: '3', name: 'Third Window Brewery', description: 'American', votes: 0, voters: [], link: 'https://www.thirdwindowbrewing.com/' },
    { id: '4', name: 'SB Public Market', description: 'American/Mexican/Japanese/Korean', votes: 0, voters: [], link: 'https://www.sbpublicmarket.com/' },
    { id: '5', name: 'M Special', description: 'American', votes: 0, voters: [], link: 'https://mspecialbrewco.com/' },
    { id: '6', name: 'Cant Go', description: 'Happy Birthday!', votes: 0, voters: [], link: 'https://www.theingredients.io/coffee' },
  ],
  lastUpdated: Date.now()
}

// KV keys
const POLL_DATA_KEY = 'birthday-poll:data'
const VOTER_REGISTRY_KEY = 'birthday-poll:voters'
const COMMENTS_KEY = 'birthday-poll:comments'

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

// Helper function to get poll data from Redis
async function getPollData(): Promise<VoteData> {
  try {
    const redis = await getRedisClient()
    const data = await redis.get(POLL_DATA_KEY)
    if (data) {
      return JSON.parse(data as string) as VoteData
    }
    // Initialize with default data if not found
    await savePollData(DEFAULT_POLL_DATA)
    return DEFAULT_POLL_DATA
  } catch (error) {
    console.error('Error getting poll data from Redis:', error)
    // Return default data if Redis fails
    return DEFAULT_POLL_DATA
  }
}

// Helper function to save poll data to Redis
async function savePollData(data: VoteData): Promise<void> {
  try {
    const redis = await getRedisClient()
    await redis.set(POLL_DATA_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving poll data to Redis:', error)
    throw error
  }
}

// Helper function to check if voter has already voted
async function hasVoted(name: string): Promise<boolean> {
  try {
    const redis = await getRedisClient()
    const voterRegistryData = await redis.get(VOTER_REGISTRY_KEY)
    const voterRegistry = voterRegistryData ? JSON.parse(voterRegistryData as string) as Record<string, string> : {}
    return name in voterRegistry
  } catch (error) {
    console.error('Error checking voter registry:', error)
    return false
  }
}

// Helper function to get previous vote for a voter
async function getPreviousVote(name: string): Promise<string | null> {
  try {
    const redis = await getRedisClient()
    const voterRegistryData = await redis.get(VOTER_REGISTRY_KEY)
    const voterRegistry = voterRegistryData ? JSON.parse(voterRegistryData as string) as Record<string, string> : {}
    return voterRegistry[name] || null
  } catch (error) {
    console.error('Error getting previous vote:', error)
    return null
  }
}

// Helper function to register a voter
async function registerVoter(name: string, restaurantId: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    const voterRegistryData = await redis.get(VOTER_REGISTRY_KEY)
    const voterRegistry = voterRegistryData ? JSON.parse(voterRegistryData as string) as Record<string, string> : {}
    voterRegistry[name] = restaurantId
    await redis.set(VOTER_REGISTRY_KEY, JSON.stringify(voterRegistry))
  } catch (error) {
    console.error('Error registering voter:', error)
    throw error
  }
}

// Helper function to get comments
async function getComments(): Promise<Record<string, string[]>> {
  try {
    const redis = await getRedisClient()
    const commentsData = await redis.get(COMMENTS_KEY)
    if (!commentsData) return {}
    
    const parsed = JSON.parse(commentsData as string)
    // Migrate old format (single string) to new format (array)
    const migrated: Record<string, string[]> = {}
    for (const [name, comment] of Object.entries(parsed)) {
      if (typeof comment === 'string') {
        // Old format: single string, convert to array
        migrated[name] = comment.trim() ? [comment] : []
      } else if (Array.isArray(comment)) {
        // New format: already an array
        migrated[name] = comment.filter((c: string) => c && c.trim())
      }
    }
    return migrated
  } catch (error) {
    console.error('Error getting comments:', error)
    return {}
  }
}

// Helper function to add a comment (supports multiple comments per user)
async function addComment(name: string, comment: string): Promise<void> {
  try {
    const redis = await getRedisClient()
    const comments = await getComments()
    
    // Initialize array if user doesn't have comments yet
    if (!comments[name]) {
      comments[name] = []
    }
    
    // Add new comment to the array
    const sanitizedComment = comment.trim().substring(0, 500)
    if (sanitizedComment) {
      comments[name].push(sanitizedComment)
    }
    
    await redis.set(COMMENTS_KEY, JSON.stringify(comments))
  } catch (error) {
    console.error('Error saving comment:', error)
    throw error
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // GET: Retrieve current poll data
  if (req.method === 'GET') {
    try {
      const pollData = await getPollData()
      const comments = await getComments()
      return res.status(200).json({
        ...pollData,
        comments
      })
    } catch (error) {
      console.error('Error getting poll data:', error)
      return res.status(500).json({ 
        error: 'Failed to get poll data' 
      })
    }
  }

  // POST: Submit a vote
  if (req.method === 'POST') {
    try {
      const { restaurantId, name, guestCount = 0, comment }: VoteRequest = req.body

      // Validate input
      if (!restaurantId || !name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ 
          error: 'Restaurant ID and name are required' 
        })
      }

      const sanitizedName = name.trim()
      const guests = Math.max(0, Math.min(50, Math.floor(guestCount || 0))) // Clamp between 0-50
      const totalPeople = 1 + guests

      // Get current poll data
      const pollData = await getPollData()

      // Check if this person has already voted
      if (await hasVoted(sanitizedName)) {
        const previousVote = await getPreviousVote(sanitizedName)
        const restaurantName = pollData.restaurants.find(r => r.id === previousVote)?.name || 'a restaurant'
        return res.status(409).json({ 
          error: 'You have already voted',
          previousVote: previousVote,
          message: `You already voted for ${restaurantName}`
        })
      }

      // Find the restaurant
      const restaurant = pollData.restaurants.find(r => r.id === restaurantId)
      if (!restaurant) {
        return res.status(404).json({ 
          error: 'Restaurant not found' 
        })
      }

      // Update the vote
      const updatedRestaurants = pollData.restaurants.map(r => {
        if (r.id === restaurantId) {
          const displayName = guests > 0 ? `${sanitizedName} (+${guests})` : sanitizedName
          return {
            ...r,
            votes: r.votes + totalPeople,
            voters: [...r.voters, displayName]
          }
        }
        return r
      })

      // Update poll data
      const updatedPollData: VoteData = {
        restaurants: updatedRestaurants,
        lastUpdated: Date.now()
      }

      // Save to KV
      await savePollData(updatedPollData)

      // Register the voter
      await registerVoter(sanitizedName, restaurantId)

      // Save comment if provided
      if (comment && comment.trim()) {
        const sanitizedComment = comment.trim().substring(0, 500) // Max 500 characters
        await saveComment(sanitizedName, sanitizedComment)
      }

      const comments = await getComments()

      return res.status(200).json({
        success: true,
        message: 'Vote recorded successfully',
        pollData: updatedPollData,
        comments
      })
    } catch (error) {
      console.error('Error submitting vote:', error)
      return res.status(500).json({ 
        error: 'Failed to submit vote',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // PATCH: Add a new comment for existing vote
  if (req.method === 'PATCH') {
    try {
      const { name, comment }: CommentRequest = req.body

      // Validate input
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ 
          error: 'Name is required' 
        })
      }

      if (!comment || typeof comment !== 'string' || !comment.trim()) {
        return res.status(400).json({ 
          error: 'Comment is required' 
        })
      }

      const sanitizedName = name.trim()

      // Allow comments from anyone with a name (no voting requirement)
      // Add new comment (supports multiple comments per user)
      await addComment(sanitizedName, comment)

      const comments = await getComments()

      return res.status(200).json({
        success: true,
        message: 'Comment added successfully',
        comments
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      return res.status(500).json({ 
        error: 'Failed to add comment',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

