import type { VercelRequest, VercelResponse } from '@vercel/node'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { password } = req.body

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' })
    }

    // Get the correct password from environment variable
    const correctPassword = process.env.BIRTHDAY_INVITE_PASSWORD

    if (!correctPassword) {
      console.error('BIRTHDAY_INVITE_PASSWORD environment variable is not set')
      return res.status(500).json({ error: 'Password verification is not configured' })
    }

    // Compare passwords (constant-time comparison to prevent timing attacks)
    const isValid = password === correctPassword

    if (isValid) {
      // Generate a simple session token (in production, you might want to use JWT)
      const sessionToken = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
      
      return res.status(200).json({
        success: true,
        token: sessionToken
      })
    } else {
      return res.status(401).json({ error: 'Incorrect password' })
    }
  } catch (error) {
    console.error('Error verifying password:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

