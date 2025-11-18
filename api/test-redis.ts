import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from 'redis'

// Simple test endpoint to verify Redis connection
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check for various possible Redis environment variable names
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

    // Get all Redis-related environment variables for debugging
    const redisEnvVars = Object.keys(process.env).filter(key => 
      key.includes('REDIS') || key.includes('KV') || key.includes('UPSTASH')
    ).reduce((acc, key) => {
      acc[key] = process.env[key] ? 'set (hidden)' : 'not set'
      return acc
    }, {} as Record<string, string>)

    if (!redisUrl) {
      return res.status(500).json({
        error: 'Redis URL not configured',
        message: 'No Redis URL environment variable found. Please check your Vercel project settings.',
        checkedVariables: [
          'KV_REST_API_URL',
          'REDIS_URL',
          'UPSTASH_REDIS_REST_URL',
          'REDIS_REST_URL'
        ],
        foundEnvVars: redisEnvVars,
        instructions: [
          '1. Go to your Vercel project dashboard',
          '2. Navigate to Storage → Redis (or the Redis provider you selected)',
          '3. Make sure Redis is connected to your project',
          '4. Check Settings → Environment Variables for Redis-related variables',
          '5. If variables are missing, try disconnecting and reconnecting Redis'
        ]
      })
    }

    // Create Redis client
    const redis = createClient({
      url: redisUrl,
      ...(redisToken && { password: redisToken }),
    })

    redis.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    // Connect to Redis
    if (!redis.isOpen) {
      await redis.connect()
    }

    // Test write
    const testKey = 'test:connection'
    const testValue = `test-${Date.now()}`
    await redis.set(testKey, testValue)

    // Test read
    const retrievedValue = await redis.get(testKey)

    // Clean up test key
    await redis.del(testKey)

    // Disconnect
    await redis.quit()

    return res.status(200).json({
      success: true,
      message: 'Redis connection successful!',
      test: {
        wrote: testValue,
        read: retrievedValue,
        match: retrievedValue === testValue,
      },
      connection: {
        url: redisUrl ? 'configured' : 'missing',
        token: redisToken ? 'configured' : 'missing',
        urlSource: redisUrl === process.env.KV_REST_API_URL ? 'KV_REST_API_URL' :
                   redisUrl === process.env.REDIS_URL ? 'REDIS_URL' :
                   redisUrl === process.env.UPSTASH_REDIS_REST_URL ? 'UPSTASH_REDIS_REST_URL' :
                   redisUrl === process.env.REDIS_REST_URL ? 'REDIS_REST_URL' : 'unknown',
      },
      // Removed allRedisEnvVars to avoid exposing environment variable names
    })
  } catch (error) {
    console.error('Redis test error:', error)
    // Don't expose stack traces or detailed error information in production
    return res.status(500).json({
      error: 'Redis connection failed',
      message: error instanceof Error ? error.message : 'Unknown error'
      // Removed stack trace exposure for security
    })
  }
}

