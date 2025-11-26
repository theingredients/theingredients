/**
 * Centralized logging utility for error tracking and debugging
 * Logs to console in dev, and can send to external services in production
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

interface LogContext {
  [key: string]: any
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
  userAgent?: string
  url?: string
  userId?: string
}

class Logger {
  private isDev = import.meta.env.DEV
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 50
  private flushInterval = 30000 // 30 seconds

  constructor() {
    // Flush logs periodically
    if (!this.isDev) {
      setInterval(() => this.flushLogs(), this.flushInterval)
    }

    // Capture unhandled errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.error('Unhandled error', {
          error: {
            name: event.error?.name || 'Error',
            message: event.message || event.error?.message || 'Unknown error',
            stack: event.error?.stack,
          },
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.error('Unhandled promise rejection', {
          error: {
            name: event.reason?.name || 'PromiseRejection',
            message: event.reason?.message || String(event.reason) || 'Unknown rejection',
            stack: event.reason?.stack,
          },
        })
      })
    }
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    // Extract error information if present
    if (context?.error instanceof Error) {
      entry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      }
    } else if (context?.error) {
      entry.error = {
        name: context.error.name || 'Error',
        message: context.error.message || String(context.error),
        stack: context.error.stack,
      }
    }

    return entry
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    const entry = this.createLogEntry(level, message, context)

    // Always log to console in dev mode
    if (this.isDev) {
      const consoleMethod = level === LogLevel.ERROR ? console.error :
                           level === LogLevel.WARN ? console.warn :
                           level === LogLevel.INFO ? console.info :
                           console.log
      
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '')
    }

    // In production, buffer logs and send periodically
    if (!this.isDev) {
      this.logBuffer.push(entry)
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs()
      }
    }
  }

  private async flushLogs() {
    if (this.logBuffer.length === 0) return

    const logsToSend = [...this.logBuffer]
    this.logBuffer = []

    try {
      // Send to logging endpoint if available
      // For now, we'll use Vercel Analytics or a custom endpoint
      // You can configure this to send to your logging service
      
      // Option 1: Send to a custom API endpoint
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: logsToSend }),
      // })

      // Option 2: Use Vercel Analytics (errors are automatically tracked)
      // For now, we'll just keep them in the buffer for manual inspection
      // In production, you might want to send these to a service like Sentry, LogRocket, etc.
      
      if (this.isDev) {
        console.log(`[Logger] Flushed ${logsToSend.length} log entries`)
      }
    } catch (error) {
      // If logging fails, put logs back in buffer (except if buffer is full)
      if (this.logBuffer.length < this.maxBufferSize) {
        this.logBuffer.unshift(...logsToSend)
      }
      
      if (this.isDev) {
        console.error('[Logger] Failed to flush logs:', error)
      }
    }
  }

  debug(message: string, context?: LogContext) {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context?: LogContext) {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context?: LogContext) {
    this.log(LogLevel.ERROR, message, context)
  }

  // Convenience methods for common error scenarios
  apiError(endpoint: string, error: Error | unknown, context?: LogContext) {
    this.error(`API Error: ${endpoint}`, {
      ...context,
      endpoint,
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  navigationError(path: string, error: Error | unknown, context?: LogContext) {
    this.error(`Navigation Error: ${path}`, {
      ...context,
      path,
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  componentError(componentName: string, error: Error | unknown, context?: LogContext) {
    this.error(`Component Error: ${componentName}`, {
      ...context,
      componentName,
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  networkError(url: string, error: Error | unknown, context?: LogContext) {
    this.error(`Network Error: ${url}`, {
      ...context,
      url,
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }

  // Get recent logs (useful for debugging)
  getRecentLogs(level?: LogLevel, limit: number = 20): LogEntry[] {
    const filtered = level
      ? this.logBuffer.filter(log => log.level === level)
      : this.logBuffer
    
    return filtered.slice(-limit)
  }
}

// Export singleton instance
export const logger = new Logger()

// Export convenience functions
export const logDebug = (message: string, context?: LogContext) => logger.debug(message, context)
export const logInfo = (message: string, context?: LogContext) => logger.info(message, context)
export const logWarn = (message: string, context?: LogContext) => logger.warn(message, context)
export const logError = (message: string, context?: LogContext) => logger.error(message, context)
export const logApiError = (endpoint: string, error: Error | unknown, context?: LogContext) => 
  logger.apiError(endpoint, error, context)
export const logNavigationError = (path: string, error: Error | unknown, context?: LogContext) => 
  logger.navigationError(path, error, context)
export const logComponentError = (componentName: string, error: Error | unknown, context?: LogContext) => 
  logger.componentError(componentName, error, context)
export const logNetworkError = (url: string, error: Error | unknown, context?: LogContext) => 
  logger.networkError(url, error, context)

