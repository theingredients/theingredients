# Logging Guide

This application uses a centralized logging utility to track errors and debug issues.

## Usage

### Basic Logging

```typescript
import { logError, logWarn, logInfo, logDebug } from '../utils/logger'

// Log an error
logError('Something went wrong', { userId: '123', action: 'fetchData' })

// Log a warning
logWarn('Rate limit approaching', { endpoint: '/api/data' })

// Log info
logInfo('User action', { action: 'click', button: 'submit' })

// Log debug (only in dev mode)
logDebug('Debug information', { state: 'loading', data: someData })
```

### Convenience Methods

```typescript
import { 
  logApiError, 
  logNavigationError, 
  logComponentError, 
  logNetworkError 
} from '../utils/logger'

// Log API errors
try {
  const response = await fetch('/api/data')
  if (!response.ok) throw new Error('API failed')
} catch (error) {
  logApiError('/api/data', error, {
    method: 'GET',
    status: response?.status,
  })
}

// Log navigation errors
try {
  navigate('/some-path')
} catch (error) {
  logNavigationError('/some-path', error)
}

// Log component errors
try {
  // component logic
} catch (error) {
  logComponentError('MyComponent', error, {
    props: { userId: props.userId },
  })
}

// Log network errors
try {
  await fetch('https://external-api.com/data')
} catch (error) {
  logNetworkError('https://external-api.com/data', error)
}
```

## What Gets Logged

The logger automatically captures:
- **Unhandled errors** - Window errors and unhandled promise rejections
- **Error details** - Stack traces, error names, messages
- **Context** - User agent, URL, timestamp
- **Custom context** - Any additional data you provide

## Development vs Production

- **Development**: All logs are printed to the browser console
- **Production**: Logs are buffered and can be sent to external services

## Log Levels

- `DEBUG` - Detailed debugging information (dev only)
- `INFO` - General information about app flow
- `WARN` - Warnings that don't break functionality
- `ERROR` - Errors that need attention

## Integration with External Services

To send logs to an external service (e.g., Sentry, LogRocket), update the `flushLogs()` method in `src/utils/logger.ts`:

```typescript
private async flushLogs() {
  // ... existing code ...
  
  try {
    // Send to your logging service
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: logsToSend }),
    })
  } catch (error) {
    // Handle error
  }
}
```

## Viewing Logs

In development, logs appear in the browser console.

To view recent logs programmatically:

```typescript
import { logger } from '../utils/logger'

// Get recent error logs
const recentErrors = logger.getRecentLogs(LogLevel.ERROR, 10)

// Get all recent logs
const allLogs = logger.getRecentLogs(undefined, 20)
```

