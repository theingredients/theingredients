# Drink Prices Feature Design

## Overview
Add the ability for users to view drink prices (latte, mocha, vanilla latte, etc.) at local coffee shops found in the search results.

## Data Structure

### Extended Interface
```typescript
interface DrinkPrice {
  name: string        // e.g., "Latte", "Mocha", "Vanilla Latte"
  price: number      // Price in USD (e.g., 5.00)
  size?: string      // Optional: "Small", "Medium", "Large"
  currency?: string  // Default: "USD"
  lastUpdated?: string // ISO date string for price freshness
}

interface CoffeeRoaster {
  // ... existing fields ...
  drinkPrices?: DrinkPrice[]  // Array of drink prices for this shop
  priceSource?: 'user' | 'api' | 'manual' | 'crowdsourced'
  priceLastUpdated?: string
}
```

## Data Sources (Options)

### Option 1: User-Submitted Prices (Crowdsourcing)
**Pros:**
- Free to implement
- Community-driven, stays current
- No API costs

**Cons:**
- Requires moderation/validation
- May have incomplete data
- Potential for inaccurate submissions

**Implementation:**
- Add "Add/Update Prices" button on each coffee shop card
- Modal form for users to submit prices
- Backend API endpoint to store prices (database or JSON file)
- Rate limiting to prevent spam
- Optional: User verification/rating system

### Option 2: Google Places API - Price Level
**Pros:**
- Already using Google Places API
- Automatic data
- Reliable source

**Cons:**
- Google only provides price_level (1-4 scale), not specific drink prices
- Would need to estimate: $ = 1-2, $$ = 3-4, $$$ = 5-6, $$$$ = 7+
- Not drink-specific

**Implementation:**
- Extract `price_level` from Google Places API response
- Map to estimated price ranges
- Display as "Average drink price: $5-6"

### Option 3: Web Scraping (Menu Sites)
**Pros:**
- Could get actual prices
- Automated

**Cons:**
- Legal/ethical concerns
- Fragile (sites change structure)
- Requires maintenance
- Rate limiting issues

### Option 4: Manual Database/JSON File
**Pros:**
- Full control
- Accurate data
- No API costs

**Cons:**
- Time-consuming to maintain
- Requires manual updates
- Doesn't scale well

### Option 5: Hybrid Approach (Recommended)
**Pros:**
- Best of both worlds
- Starts with manual/API data
- Allows user contributions

**Cons:**
- More complex implementation

**Implementation:**
- Start with Google Places `price_level` as baseline
- Allow users to submit specific drink prices
- Store in database/JSON
- Display user-submitted prices when available, fallback to estimated

## UI/UX Design

### Option A: Expandable Price Section
```
[Coffee Shop Name]
📍 Address
📞 Phone
📍 0.5 mi away

[▼ View Prices]  ← Click to expand
  Latte: $5.00
  Mocha: $5.00
  Vanilla Latte: $6.00
  Cappuccino: $5.50
  [Add/Update Prices]
```

### Option B: Always Visible (Compact)
```
[Coffee Shop Name]
📍 Address
💰 Latte: $5 | Mocha: $5 | Vanilla Latte: $6
📍 0.5 mi away
```

### Option C: Price Badge/Icon
```
[Coffee Shop Name]  💰
📍 Address
📍 0.5 mi away

[Click shop card to see prices in detail]
```

### Option D: Separate Price Modal
```
[Coffee Shop Name]
📍 Address
[💰 View Prices]  ← Button opens price modal
📍 0.5 mi away
```

## Recommended Implementation Plan

### Phase 1: Basic Display (Manual Data)
1. Add `drinkPrices` field to `CoffeeRoaster` interface
2. Create a simple JSON file or database to store prices
3. Add UI component to display prices (expandable section)
4. Style prices section in CSS

### Phase 2: Google Places Integration
1. Extract `price_level` from Google Places API
2. Map to estimated price ranges
3. Display as fallback when specific prices unavailable
4. Show "Estimated" badge

### Phase 3: User Submissions (Optional)
1. Add "Add Prices" button on coffee shop cards
2. Create submission form modal
3. Backend API endpoint to store submissions
4. Validation and sanitization
5. Display user-submitted prices with "Community" badge

## Technical Considerations

### Data Storage
- **Option 1**: JSON file in repo (simple, version controlled)
- **Option 2**: Vercel KV or similar (serverless database)
- **Option 3**: Google Sheets API (easy to update manually)
- **Option 4**: Supabase/PostgreSQL (full database)

### Price Updates
- How often to refresh prices?
- Who can update? (admin only, or users?)
- How to handle price changes over time?

### Currency
- Default to USD
- Could add currency detection based on location
- Format: `$5.00` or `5.00 USD`

### Validation
- Sanitize user inputs
- Validate price ranges (e.g., $0.50 - $20.00)
- Prevent spam/abuse
- Rate limiting on submissions

## Example Data Structure

```json
{
  "coffeeShops": {
    "handlebar-coffee-santa-barbara": {
      "name": "Handlebar Coffee",
      "drinkPrices": [
        { "name": "Latte", "price": 5.00, "size": "12oz" },
        { "name": "Mocha", "price": 5.50, "size": "12oz" },
        { "name": "Vanilla Latte", "price": 6.00, "size": "12oz" },
        { "name": "Cappuccino", "price": 5.00, "size": "12oz" }
      ],
      "priceSource": "user",
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  }
}
```

## API Endpoints (if using user submissions)

### GET `/api/drink-prices?shopId=xxx`
Returns prices for a specific shop

### POST `/api/drink-prices`
Submit new/updated prices
```json
{
  "shopId": "handlebar-coffee-santa-barbara",
  "shopName": "Handlebar Coffee",
  "prices": [
    { "name": "Latte", "price": 5.00 }
  ]
}
```

## Security Considerations
- Sanitize all user inputs
- Rate limit submissions (e.g., 5 per hour per IP)
- Validate price ranges
- Optional: CAPTCHA for submissions
- Optional: Admin approval before displaying

## Future Enhancements
- Price history/trends
- Size variations (Small/Medium/Large)
- Seasonal pricing
- Location-specific pricing (if chain)
- Price comparisons across shops
- "Best value" indicators

