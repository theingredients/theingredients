# API Cost Tracking Guide

This guide explains how to monitor and track costs for external APIs used in The Ingredients project.

## APIs Used

### Paid APIs
1. **Google Places API** - Pay as you go
   - Nearby Search: $32 per 1,000 requests
   - Text Search: $32 per 1,000 requests
   - Current usage: Coffee roasters search (2 calls per search) + Drinks search (2 calls per search)

2. **Stripe API** - Pay per transaction
   - Already tracked in Stripe Dashboard
   - No additional tracking needed

### Free APIs
- OpenStreetMap Overpass API (free)
- Open-Meteo Weather API (free)
- BigDataCloud Geocoding API (free)
- wttr.in Weather API (free)
- Bored API (free)
- Joke API (free)

## Tracking Methods

### 1. Built-in Usage Tracker (In-Memory)

The project includes a simple in-memory usage tracker that logs API calls:

**Endpoint:** `/api/api-usage-stats`

**Features:**
- Tracks Google Places API calls
- Estimates costs based on current pricing
- Shows cached vs. actual API calls
- Groups calls by day and API type
- Shows last 50 API calls

**Limitations:**
- Data resets on serverless function cold start
- Only tracks calls made through the serverless functions
- Estimates may not match exact Google billing

**Usage:**
```bash
curl https://your-domain.vercel.app/api/api-usage-stats
```

### 2. Google Cloud Console (Recommended)

The most accurate way to track Google Places API costs:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project

2. **Navigate to APIs & Services**
   - Go to **APIs & Services** → **Dashboard**
   - Find **Places API (New)** in the list

3. **View Usage**
   - Click on **Places API (New)**
   - Go to **Metrics** tab
   - View requests per day/hour
   - Check **Quotas** tab for rate limits

4. **Set Up Billing Alerts**
   - Go to **Billing** → **Budgets & alerts**
   - Create a budget for your project
   - Set alerts at 50%, 90%, and 100% of your budget
   - Configure email notifications

5. **View Detailed Costs**
   - Go to **Billing** → **Reports**
   - Filter by **Places API**
   - View daily/monthly costs
   - Export data for analysis

### 3. Vercel Logs

View API call logs in Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project

2. **View Function Logs**
   - Go to **Deployments** → Select a deployment
   - Click **Functions** tab
   - View logs for `api/google-places-search.ts`
   - Look for `[API Usage]` log entries

3. **Search Logs**
   - Use Vercel's log search to filter by:
     - `[API Usage]` - All API calls
     - `google-places` - Google Places API calls
     - `CACHED` - Cached responses (no cost)

### 4. Serverless Function Logs

The code automatically logs API usage:

```
[API Usage] google-places - nearbysearch/coffee - Cost: $0.000064 - IP: 192.168.1.1
[API Usage] google-places - nearbysearch/drinks - CACHED (no cost)
```

## Cost Optimization Features

The project includes several cost-saving features:

### 1. Response Caching
- **Duration:** 1 hour
- **Benefit:** Same location searches return cached results (no API call)
- **Expected savings:** 70-90% for repeat searches

### 2. Rate Limiting
- **Limit:** 5 requests per IP per hour
- **Benefit:** Prevents abuse and excessive API calls
- **Location:** `api/google-places-search.ts`

### 3. Request Deduplication
- **Feature:** Prevents duplicate searches from rapid clicks
- **Benefit:** Avoids unnecessary API calls
- **Location:** `src/pages/Coffee.tsx`

### 4. Reduced Parallel Searches
- **Coffee search:** 2 API calls (roaster + coffee keywords)
- **Drinks search:** 2 API calls (tea + smoothie keywords)
- **Previous:** 4 calls for drinks search
- **Savings:** 50% reduction for drinks search

## Cost Estimation

### Current Pricing (as of 2024)
- **Google Places Nearby Search:** $32 per 1,000 requests
- **Cost per request:** $0.032

### Example Monthly Costs

**Scenario 1: Light Usage**
- 100 searches per month
- Coffee search: 1 call × 100 = 100 calls
- Drinks search: 1 call × 50 = 50 calls
- Total: 150 calls
- **Cost:** 150 × $0.032 = **$4.80/month**

**Scenario 2: Moderate Usage**
- 500 searches per month
- Coffee search: 1 call × 500 = 500 calls
- Drinks search: 1 call × 250 = 250 calls
- Total: 750 calls
- **Cost:** 750 × $0.032 = **$24/month**

**Scenario 3: Heavy Usage**
- 2,000 searches per month
- Coffee search: 1 call × 2,000 = 2,000 calls
- Drinks search: 1 call × 1,000 = 1,000 calls
- Total: 3,000 calls
- **Cost:** 3,000 × $0.032 = **$96/month**

**Note:** With caching, actual costs will be 70-90% lower for repeat searches.

**Optimization:** Reduced from 2 API calls per search to 1 call per search (50% reduction).

## Setting Up Budget Alerts

### Built-in Budget Alerts (Automatic)

The system includes automatic budget alerts that trigger at 50%, 75%, and 90% usage:

1. **Configure Budget:** Set `GOOGLE_PLACES_BUDGET` environment variable in Vercel (default: $50/month)
2. **Alerts:** Automatically logged to Vercel function logs when thresholds are reached
3. **View Status:** Check `/api/api-usage-stats` endpoint for current budget status

**Alert Format:**
```
[BUDGET ALERT] Google Places API usage has reached 50% of monthly budget!

Current Usage: $25.00 / $50.00
Percentage Used: 50.0%
Days Remaining: 15
Projected Monthly Cost: $50.00
```

### Google Cloud Console (Recommended for Production)

For more reliable alerts and email notifications:

1. Go to **Billing** → **Budgets & alerts**
2. Click **Create Budget**
3. Set budget amount (e.g., $50/month)
4. Configure alerts:
   - Alert at 50% of budget
   - Alert at 75% of budget
   - Alert at 90% of budget
   - Alert at 100% of budget
5. Add email notifications
6. Save budget

### Vercel (if using Vercel billing)

1. Go to **Settings** → **Billing**
2. Set up spending limits
3. Configure email notifications

## Monitoring Best Practices

1. **Check Daily**
   - Review Google Cloud Console daily for first week
   - Monitor for unexpected spikes

2. **Set Up Alerts**
   - Configure budget alerts at 50%, 90%, 100%
   - Set up email notifications

3. **Review Weekly**
   - Check `/api/api-usage-stats` endpoint weekly
   - Compare with Google Cloud Console data

4. **Optimize Regularly**
   - Review cache hit rates
   - Adjust rate limits if needed
   - Consider increasing cache TTL for stable locations

## Troubleshooting

### High Costs

If you notice unexpectedly high costs:

1. **Check Vercel Logs**
   - Look for excessive API calls
   - Check for cache misses

2. **Review Rate Limiting**
   - Ensure rate limiting is working
   - Check for abuse or bot traffic

3. **Verify Caching**
   - Check cache hit rates
   - Ensure cache is working properly

4. **Review Google Cloud Console**
   - Check for API errors (failed requests still cost)
   - Verify API key restrictions are working

### No Data in Usage Tracker

The in-memory tracker resets on cold start. For persistent tracking:
- Use Google Cloud Console (recommended)
- Consider integrating with a database
- Use external monitoring service (e.g., Datadog, New Relic)

## Additional Resources

- [Google Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Cloud Billing Documentation](https://cloud.google.com/billing/docs)
- [Vercel Function Logs](https://vercel.com/docs/concepts/functions/serverless-functions/logs)

