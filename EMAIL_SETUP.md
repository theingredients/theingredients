# Email Notification Setup for Birthday Poll

This guide will help you set up email notifications so you receive an email whenever someone votes in your birthday poll using Twilio SendGrid.

## Prerequisites

1. A Twilio account (free tier available at https://www.twilio.com)
2. A verified email address or domain

## Step 1: Create a Twilio Account

1. Go to https://www.twilio.com and sign up for a free account
2. Verify your email address and phone number

## Step 2: Set Up SendGrid (Twilio's Email Service)

Twilio uses SendGrid for email services (Twilio owns SendGrid):

1. Log into your Twilio Console
2. Navigate to **Email** → **SendGrid** in the sidebar
3. If you haven't set up SendGrid yet, click **Get Started with SendGrid**
4. You'll be redirected to SendGrid to create an account (it's free and integrated with Twilio)

## Step 3: Get Your SendGrid API Key

1. In the SendGrid dashboard (or Twilio Console → Email → SendGrid), go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Birthday Poll Notifications")
4. Select **Full Access** or **Restricted Access** with Mail Send permissions
5. Copy the API key (you'll only see it once!)

## Step 4: Verify Your Sender Identity

You need to verify who you're sending emails from:

### Option A: Single Sender Verification (Easiest for Testing)

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication** → **Single Sender Verification**
2. Click **Create New Sender**
3. Fill in your information:
   - **From Email**: The email address you want to send from
   - **From Name**: Your name or "Birthday Poll"
   - **Reply To**: Your email address
4. Verify the email address (check your inbox for verification email)

### Option B: Domain Authentication (Recommended for Production)

1. In SendGrid dashboard, go to **Settings** → **Sender Authentication** → **Domain Authentication**
2. Click **Authenticate Your Domain**
3. Follow the DNS setup instructions to add records to your domain
4. Once verified, you can use any email address from that domain

**For testing/development**, you can use Single Sender Verification with your personal email.

## Step 5: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

### Required Variables:

- **`TWILIO_SENDGRID_API_KEY`**
  - Value: Your SendGrid API key from Step 3
  - Environment: Production, Preview, Development (or just Production if you prefer)

- **`BIRTHDAY_POLL_NOTIFICATION_EMAIL`**
  - Value: Your email address where you want to receive notifications
  - Example: `your-email@gmail.com`
  - Environment: Production, Preview, Development

- **`TWILIO_FROM_EMAIL`** (Required)
  - Value: The verified email address to send from (from Step 4)
  - Example: `notifications@yourdomain.com` or `your-email@gmail.com`
  - Environment: Production, Preview, Development

- **`TWILIO_FROM_NAME`** (Optional, but recommended)
  - Value: The name to display as the sender
  - Example: `Birthday Poll` or `Jerome's Birthday`
  - Environment: Production, Preview, Development
  - Default: `Birthday Poll` if not set

## Step 6: Deploy

After adding the environment variables:

1. Go to your Vercel project
2. Click **Deployments**
3. Click **Redeploy** on your latest deployment (or push a new commit)
4. The new environment variables will be available

## Testing

1. Visit your birthday poll page
2. Enter an email and vote for a restaurant
3. Check your email inbox for the notification

## Troubleshooting

### Emails not sending?

1. **Check Vercel logs:**
   - Go to your Vercel project → **Deployments** → Click on latest deployment → **Functions** tab
   - Look for errors in the `/api/send-vote-notification` function

2. **Verify environment variables:**
   - Make sure all required environment variables are set
   - Ensure they're set for the correct environment (Production/Preview/Development)

3. **Check SendGrid dashboard:**
   - Go to SendGrid dashboard → **Activity** → **Email Activity**
   - Look for any failed email attempts and error messages
   - Check if your sender is verified

4. **Verify sender identity:**
   - Make sure your `TWILIO_FROM_EMAIL` is verified in SendGrid
   - For Single Sender Verification, check your email inbox for the verification link
   - For Domain Authentication, verify DNS records are correct

5. **Check API key permissions:**
   - Ensure your API key has "Mail Send" permissions
   - Try creating a new API key with Full Access if issues persist

### Common Issues

- **"Sender email not verified"**: Make sure you've verified your sender email in SendGrid
- **"API key invalid"**: Double-check your API key is correct and has proper permissions
- **"Domain not authenticated"**: If using domain authentication, verify DNS records are set correctly

## Cost

- **Twilio SendGrid Free Tier:** 100 emails/day forever
- For a birthday poll, this should be more than enough!
- Paid plans start at $19.95/month for 50,000 emails/month

## Security Notes

- Never commit API keys to your repository
- Always use environment variables for sensitive data
- The API endpoint validates input and only sends to the configured recipient email
- Use domain authentication for production to improve deliverability

## Additional Resources

- [Twilio SendGrid Documentation](https://docs.sendgrid.com/)
- [SendGrid API Reference](https://docs.sendgrid.com/api-reference)
- [Twilio Console](https://console.twilio.com/)
