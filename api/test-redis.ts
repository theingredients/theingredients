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
    const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL
    const redisToken = process.env.KV_REST_API_TOKEN

    if (!redisUrl) {
      return res.status(500).json({
        error: 'Redis URL not configured',
        message: 'KV_REST_API_URL or REDIS_URL environment variable is missing',
        envVars: {
          hasKV_REST_API_URL: !!process.env.KV_REST_API_URL,
          hasREDIS_URL: !!process.env.REDIS_URL,
          hasKV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        }
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
      }
    })
  } catch (error) {
    console.error('Redis test error:', error)
    return res.status(500).json({
      error: 'Redis connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : String(error)
    })
  }
}

