import type { VercelRequest, VercelResponse } from '@vercel/node'

interface VoteNotificationRequest {
  restaurantName: string
  voterEmail: string
  restaurantId: string
  totalVotes: number
  allVotesTotal?: number
  guestCount?: number
  timestamp: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { restaurantName, voterEmail, restaurantId, totalVotes, allVotesTotal, guestCount, timestamp } = req.body as VoteNotificationRequest

    // Validate required fields
    if (!restaurantName || !voterEmail || !restaurantId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Get recipient email from environment variable
    const recipientEmail = process.env.BIRTHDAY_POLL_NOTIFICATION_EMAIL
    if (!recipientEmail) {
      console.error('BIRTHDAY_POLL_NOTIFICATION_EMAIL environment variable not set')
      return res.status(500).json({ error: 'Email notification not configured' })
    }

    // Get Twilio SendGrid API key
    const sendGridApiKey = process.env.TWILIO_SENDGRID_API_KEY
    if (!sendGridApiKey) {
      console.error('TWILIO_SENDGRID_API_KEY environment variable not set')
      return res.status(500).json({ error: 'Email service not configured' })
    }

    // Get from email address
    const fromEmail = process.env.TWILIO_FROM_EMAIL || 'notifications@yourdomain.com'
    const fromName = process.env.TWILIO_FROM_NAME || 'Birthday Poll'

    // Send email via Twilio SendGrid
    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sendGridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: recipientEmail }],
          subject: `🎉 New Vote: ${restaurantName}`,
        }],
        from: {
          email: fromEmail,
          name: fromName,
        },
        content: [{
          type: 'text/html',
          value: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>New Vote Notification</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎉 New Vote Received!</h1>
              </div>
              
              <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0;">
                <h2 style="color: #667eea; margin-top: 0;">Restaurant: ${restaurantName}</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                  <p style="margin: 10px 0;"><strong>Voter Email:</strong> ${voterEmail}</p>
                  <p style="margin: 10px 0;"><strong>Restaurant ID:</strong> ${restaurantId}</p>
                  <p style="margin: 10px 0;"><strong>Votes for ${restaurantName}:</strong> ${totalVotes}</p>
                  ${guestCount !== undefined && guestCount > 0 ? `<p style="margin: 10px 0;"><strong>👥 Total Guests:</strong> ${guestCount} ${guestCount === 1 ? 'person' : 'people'}</p>` : ''}
                  ${allVotesTotal !== undefined ? `<p style="margin: 10px 0;"><strong>Total Votes (All Restaurants):</strong> ${allVotesTotal}</p>` : ''}
                  <p style="margin: 10px 0;"><strong>Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  This is an automated notification from your birthday poll.
                </p>
              </div>
            </body>
          </html>
        `,
        }, {
          type: 'text/plain',
          value: `
New Vote Received!

Restaurant: ${restaurantName}
Voter Email: ${voterEmail}
Restaurant ID: ${restaurantId}
Votes for ${restaurantName}: ${totalVotes}
${guestCount !== undefined && guestCount > 0 ? `Total Guests: ${guestCount} ${guestCount === 1 ? 'person' : 'people'}\n` : ''}${allVotesTotal !== undefined ? `Total Votes (All Restaurants): ${allVotesTotal}\n` : ''}Time: ${new Date(timestamp).toLocaleString()}

This is an automated notification from your birthday poll.
          `.trim(),
        }],
      }),
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Twilio SendGrid API error:', emailResponse.status, errorData)
      return res.status(500).json({ error: 'Failed to send email notification' })
    }

    // SendGrid returns 202 Accepted on success (no body)
    const messageId = emailResponse.headers.get('x-message-id') || 'unknown'
    
    return res.status(200).json({ 
      success: true, 
      messageId: messageId,
      message: 'Vote notification sent successfully' 
    })

  } catch (error) {
    console.error('Error sending vote notification:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

