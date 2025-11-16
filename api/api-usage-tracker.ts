// API Usage Tracker
// Tracks API calls for cost monitoring
// This is a simple in-memory tracker (resets on cold start)
// For production, consider using a database or external service

interface ApiCall {
  timestamp: number
  api: string
  endpoint: string
  cost?: number // Estimated cost in USD
  cached: boolean
  ip?: string
}

interface ApiStats {
  totalCalls: number
  cachedCalls: number
  estimatedCost: number
  callsByDay: Record<string, number>
  callsByApi: Record<string, number>
}

// In-memory store (resets on cold start)
const apiCalls: ApiCall[] = []
const MAX_STORED_CALLS = 10000 // Limit memory usage

// Google Places API pricing (as of 2024)
// Nearby Search: $32 per 1000 requests
const GOOGLE_PLACES_COST_PER_1000 = 32
const COST_PER_REQUEST = GOOGLE_PLACES_COST_PER_1000 / 1000 // $0.032 per request

function addApiCall(api: string, endpoint: string, cached: boolean = false, ip?: string) {
  const now = Date.now()
  
  // Calculate estimated cost
  let cost = 0
  if (api === 'google-places' && !cached) {
    cost = COST_PER_REQUEST
  }
  
  const call: ApiCall = {
    timestamp: now,
    api,
    endpoint,
    cost,
    cached,
    ip
  }
  
  apiCalls.push(call)
  
  // Keep only recent calls to limit memory
  if (apiCalls.length > MAX_STORED_CALLS) {
    apiCalls.shift() // Remove oldest
  }
  
  // Log to console for Vercel logs
  if (!cached) {
    console.log(`[API Usage] ${api} - ${endpoint} - Cost: $${cost.toFixed(6)} - IP: ${ip || 'unknown'}`)
  } else {
    console.log(`[API Usage] ${api} - ${endpoint} - CACHED (no cost)`)
  }
}

function getStats(): ApiStats {
  const now = Date.now()
  
  // Filter to last 30 days
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000)
  const recentCalls = apiCalls.filter(call => call.timestamp > thirtyDaysAgo)
  
  const stats: ApiStats = {
    totalCalls: recentCalls.length,
    cachedCalls: recentCalls.filter(call => call.cached).length,
    estimatedCost: recentCalls.reduce((sum, call) => sum + (call.cost || 0), 0),
    callsByDay: {},
    callsByApi: {}
  }
  
  // Group by day
  recentCalls.forEach(call => {
    const date = new Date(call.timestamp).toISOString().split('T')[0]
    stats.callsByDay[date] = (stats.callsByDay[date] || 0) + 1
  })
  
  // Group by API
  recentCalls.forEach(call => {
    stats.callsByApi[call.api] = (stats.callsByApi[call.api] || 0) + 1
  })
  
  return stats
}

function getRecentCalls(limit: number = 100): ApiCall[] {
  return apiCalls.slice(-limit).reverse() // Most recent first
}

export { addApiCall, getStats, getRecentCalls }

