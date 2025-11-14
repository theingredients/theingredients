/**
 * Rate limiter utility to prevent API abuse
 * Tracks requests within a time window and blocks if limit exceeded
 */

interface RateLimiterOptions {
  maxRequests: number
  windowMs: number
}

export const createRateLimiter = ({ maxRequests, windowMs }: RateLimiterOptions) => {
  const requests: number[] = []

  return (): boolean => {
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Remove requests outside the current window
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    // Add current request
    recentRequests.push(now)
    
    // Update requests array
    requests.length = 0
    requests.push(...recentRequests)
    
    return true // Request allowed
  }
}

// Pre-configured rate limiters for different use cases
export const apiRateLimiter = createRateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60000  // per minute
})

export const strictRateLimiter = createRateLimiter({
  maxRequests: 5,  // 5 requests
  windowMs: 60000   // per minute
})

