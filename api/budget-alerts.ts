// Budget Alert System
// Tracks API usage against a budget and sends alerts at 50%, 75%, and 90%

interface BudgetConfig {
  monthlyBudget: number // Monthly budget in USD
  alertThresholds: number[] // [50, 75, 90] for percentage thresholds
}

interface BudgetStatus {
  currentUsage: number
  budget: number
  percentageUsed: number
  daysRemaining: number
  projectedMonthlyCost: number
  alertsSent: Set<number> // Track which thresholds have been alerted
}

// Default budget: $50/month (adjustable via environment variable)
// Set GOOGLE_PLACES_BUDGET environment variable to customize
const DEFAULT_BUDGET = 50

// Google Places API cost per request
// $32 per 1000 requests = $0.032 per request
const COST_PER_REQUEST = 0.032

// In-memory budget tracking (resets on cold start)
// For production, consider using a database or external service
const budgetStatus: BudgetStatus = {
  currentUsage: 0,
  budget: parseFloat(process.env.GOOGLE_PLACES_BUDGET || String(DEFAULT_BUDGET)),
  percentageUsed: 0,
  daysRemaining: 30,
  projectedMonthlyCost: 0,
  alertsSent: new Set()
}

// Track daily usage
interface DailyUsage {
  date: string
  cost: number
}

const dailyUsage: DailyUsage[] = []
const MAX_DAYS_TRACKED = 30

function updateBudgetStatus(cost: number) {
  const now = Date.now()
  const today = new Date(now).toISOString().split('T')[0]
  
  // Update current usage
  budgetStatus.currentUsage += cost
  
  // Update daily usage
  const todayUsage = dailyUsage.find(u => u.date === today)
  if (todayUsage) {
    todayUsage.cost += cost
  } else {
    dailyUsage.push({ date: today, cost })
    // Keep only last 30 days
    if (dailyUsage.length > MAX_DAYS_TRACKED) {
      dailyUsage.shift()
    }
  }
  
  // Calculate percentage used
  budgetStatus.percentageUsed = (budgetStatus.currentUsage / budgetStatus.budget) * 100
  
  // Calculate days remaining in month
  const todayDate = new Date(now)
  const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0)
  budgetStatus.daysRemaining = Math.ceil((lastDayOfMonth.getTime() - now) / (1000 * 60 * 60 * 24))
  
  // Project monthly cost based on current daily average
  const daysElapsed = 30 - budgetStatus.daysRemaining
  if (daysElapsed > 0) {
    const dailyAverage = budgetStatus.currentUsage / daysElapsed
    budgetStatus.projectedMonthlyCost = dailyAverage * 30
  } else {
    budgetStatus.projectedMonthlyCost = budgetStatus.currentUsage
  }
  
  // Check alert thresholds
  checkAlerts()
}

function checkAlerts() {
  const thresholds = [50, 75, 90]
  
  for (const threshold of thresholds) {
    if (budgetStatus.percentageUsed >= threshold && !budgetStatus.alertsSent.has(threshold)) {
      sendAlert(threshold)
      budgetStatus.alertsSent.add(threshold)
    }
  }
}

function sendAlert(threshold: number) {
  const message = `[BUDGET ALERT] Google Places API usage has reached ${threshold}% of monthly budget!
  
Current Usage: $${budgetStatus.currentUsage.toFixed(2)} / $${budgetStatus.budget.toFixed(2)}
Percentage Used: ${budgetStatus.percentageUsed.toFixed(1)}%
Days Remaining: ${budgetStatus.daysRemaining}
Projected Monthly Cost: $${budgetStatus.projectedMonthlyCost.toFixed(2)}

Please review your API usage and consider:
- Checking for unexpected spikes
- Reviewing cache hit rates
- Adjusting rate limits if needed
- Increasing budget if usage is expected

View detailed usage: /api/api-usage-stats
Google Cloud Console: https://console.cloud.google.com/apis/api/places-backend.googleapis.com/metrics`

  // Log alert (will appear in Vercel logs)
  console.error(message)
  
  // In production, you could:
  // - Send email via SendGrid, Mailgun, etc.
  // - Send Slack/Discord webhook
  // - Send SMS via Twilio
  // - Use Vercel's webhook system
  
  // For now, we'll just log it and the user can set up external monitoring
}

function getBudgetStatus(): BudgetStatus {
  return {
    ...budgetStatus,
    alertsSent: new Set(budgetStatus.alertsSent) // Return a copy
  }
}

function resetMonthlyBudget() {
  // Reset at start of new month
  budgetStatus.currentUsage = 0
  budgetStatus.alertsSent.clear()
  dailyUsage.length = 0
}

// Check if we should reset (new month)
function checkMonthlyReset() {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastReset = new Date(firstDayOfMonth.getTime())
  
  // If it's a new month, reset
  if (now.getTime() > lastReset.getTime() + (24 * 60 * 60 * 1000)) {
    resetMonthlyBudget()
  }
}

// Initialize check on module load
checkMonthlyReset()

export { updateBudgetStatus, getBudgetStatus, resetMonthlyBudget, checkMonthlyReset }

