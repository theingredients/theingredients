# SendGrid Setup Checklist

Use this checklist to verify your SendGrid email setup is complete.

## ✅ Step 1: SendGrid Account & API Key

- [ ] **Created SendGrid account** (via Twilio Console or directly at sendgrid.com)
- [ ] **Created API Key** in SendGrid dashboard:
  - Go to: Settings → API Keys
  - Click "Create API Key"
  - Name it (e.g., "Birthday Poll")
  - Select "Full Access" or "Restricted Access" with "Mail Send" permission
  - **Copied the API key** (you only see it once!)

## ✅ Step 2: Sender Verification (CRITICAL - Most Common Issue!)

You MUST verify the email address you're sending FROM. Choose one:

### Option A: Single Sender Verification (Easiest)
- [ ] Go to: Settings → Sender Authentication → Single Sender Verification
- [ ] Click "Create New Sender"
- [ ] Fill in:
  - **From Email**: Your email (e.g., `your-email@gmail.com`)
  - **From Name**: "Birthday Poll" or your name
  - **Reply To**: Same as From Email
- [ ] **Check your email inbox** for verification email
- [ ] **Click the verification link** in the email
- [ ] Status should show "Verified" ✅

### Option B: Domain Authentication (For Production)
- [ ] Go to: Settings → Sender Authentication → Domain Authentication
- [ ] Click "Authenticate Your Domain"
- [ ] Follow DNS setup instructions
- [ ] Add DNS records to your domain
- [ ] Wait for verification (can take up to 48 hours)

**⚠️ IMPORTANT**: The email in `TWILIO_FROM_EMAIL` MUST match a verified sender!

## ✅ Step 3: Vercel Environment Variables

Go to your Vercel project → Settings → Environment Variables and verify:

- [ ] **`TWILIO_SENDGRID_API_KEY`**
  - Value: Your API key from Step 1
  - Environment: ✅ Production (and Preview/Development if needed)
  - Format: Should start with `SG.` (e.g., `SG.xxxxxxxxxxxxx`)

- [ ] **`BIRTHDAY_POLL_NOTIFICATION_EMAIL`**
  - Value: Your email where you want to receive notifications
  - Example: `your-email@gmail.com`
  - Environment: ✅ Production (and Preview/Development if needed)

- [ ] **`TWILIO_FROM_EMAIL`**
  - Value: **MUST match a verified sender from Step 2**
  - Example: `your-email@gmail.com` (same as verified sender)
  - Environment: ✅ Production (and Preview/Development if needed)
  - ⚠️ **This is the most common issue!** Must be verified in SendGrid.

- [ ] **`TWILIO_FROM_NAME`** (Optional but recommended)
  - Value: "Birthday Poll" or "Jerome's Birthday"
  - Environment: ✅ Production (and Preview/Development if needed)

## ✅ Step 4: Redeploy After Adding Variables

- [ ] After adding/updating environment variables, **redeploy your Vercel project**
- [ ] Go to: Deployments → Click "..." on latest deployment → Redeploy
- [ ] Or push a new commit to trigger redeploy

## ✅ Step 5: Test & Debug

### Test the Vote:
- [ ] Visit your birthday poll page (`/jda11202025`)
- [ ] Enter an email and vote for a restaurant
- [ ] Check browser console for any errors

### Check Vercel Logs:
- [ ] Go to: Vercel project → Deployments → Latest deployment → Functions tab
- [ ] Click on `/api/send-vote-notification`
- [ ] Look for error messages in the logs
- [ ] Common errors:
  - `"Email notification not configured"` → Missing `BIRTHDAY_POLL_NOTIFICATION_EMAIL`
  - `"Email service not configured"` → Missing `TWILIO_SENDGRID_API_KEY`
  - `"Failed to send email notification"` → Check SendGrid error below

### Check SendGrid Dashboard:
- [ ] Go to: SendGrid dashboard → Activity → Email Activity
- [ ] Look for your email attempt
- [ ] Check the status:
  - ✅ **Delivered**: Success!
  - ❌ **Failed**: Click to see error message
  - Common errors:
    - **"The from address does not match a verified Sender Identity"**
      - Fix: Verify your sender email in Step 2
      - Make sure `TWILIO_FROM_EMAIL` matches the verified email exactly
    - **"Invalid API key"**
      - Fix: Regenerate API key and update `TWILIO_SENDGRID_API_KEY`
    - **"Permission denied"**
      - Fix: Check API key has "Mail Send" permission

## 🔍 Common Issues & Solutions

### Issue: "Sender email not verified"
**Solution:**
1. Go to SendGrid → Settings → Sender Authentication → Single Sender Verification
2. Verify the email address matches your `TWILIO_FROM_EMAIL` exactly
3. Check your email inbox for verification link
4. Click the verification link
5. Wait a few minutes, then try again

### Issue: "API key invalid"
**Solution:**
1. Go to SendGrid → Settings → API Keys
2. Create a new API key with "Full Access"
3. Copy the new key
4. Update `TWILIO_SENDGRID_API_KEY` in Vercel
5. Redeploy

### Issue: Environment variables not working
**Solution:**
1. Make sure variables are set for the correct environment (Production/Preview/Development)
2. After adding variables, **redeploy** your project
3. Variables are only available after redeploy

### Issue: No errors but no email received
**Solution:**
1. Check SendGrid → Activity → Email Activity to see if email was sent
2. Check spam/junk folder
3. Verify `BIRTHDAY_POLL_NOTIFICATION_EMAIL` is correct
4. Check Vercel logs for any silent failures

## 📋 Quick Verification Commands

You can test your API endpoint directly (replace with your domain):

```bash
curl -X POST https://your-domain.vercel.app/api/send-vote-notification \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantName": "Test Restaurant",
    "voterEmail": "test@example.com",
    "restaurantId": "1",
    "totalVotes": 1,
    "allVotesTotal": 1,
    "timestamp": "2025-01-01T00:00:00.000Z"
  }'
```

Check the response - it should return `{"success": true}` if everything is configured correctly.

## 🎯 Most Likely Issues (In Order)

1. **Sender email not verified** (90% of issues)
   - Fix: Verify your sender email in SendGrid

2. **Environment variables not set** (5% of issues)
   - Fix: Add all required variables in Vercel

3. **API key invalid or wrong permissions** (3% of issues)
   - Fix: Create new API key with proper permissions

4. **Didn't redeploy after adding variables** (2% of issues)
   - Fix: Redeploy your Vercel project

## 📞 Still Having Issues?

1. Check Vercel function logs for the exact error message
2. Check SendGrid Activity dashboard for detailed error
3. Verify each item in this checklist
4. Make sure `TWILIO_FROM_EMAIL` exactly matches a verified sender email

