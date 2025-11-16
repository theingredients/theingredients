import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getStats, getRecentCalls } from './api-usage-tracker'
import { getBudgetStatus } from './budget-alerts'

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = getStats()
    const recentCalls = getRecentCalls(50) // Last 50 calls
    const budgetStatus = getBudgetStatus()
    
    return res.status(200).json({
      stats,
      recentCalls,
      budget: budgetStatus,
      note: 'This is in-memory data and resets on serverless function cold start. For production monitoring, use Google Cloud Console.'
    })
  } catch (error) {
    console.error('Error getting API usage stats:', error)
    return res.status(500).json({ 
      error: 'Failed to get API usage stats' 
    })
  }
}

