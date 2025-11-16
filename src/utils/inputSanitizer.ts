/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitizes text input to prevent XSS attacks
 * Removes dangerous characters and limits length
 * @param input - The input string to sanitize
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string, maxLength: number = 100): string => {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    // Remove HTML tags and dangerous characters
    .replace(/[<>\"'&]/g, '')
    // Remove script tags and event handlers (case insensitive)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove javascript: and data: protocols
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Trim whitespace
    .trim()
    // Limit length
    .slice(0, maxLength)
}

/**
 * Validates phone number format (digits, *, #, + only)
 * @param phoneNumber - The phone number to validate
 * @param maxLength - Maximum allowed length (default: 15)
 * @returns true if valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string, maxLength: number = 15): boolean => {
  if (typeof phoneNumber !== 'string') {
    return false
  }
  
  // Only allow digits, *, #, and +
  const phoneRegex = /^[0-9*#+]*$/
  
  return phoneNumber.length <= maxLength && phoneRegex.test(phoneNumber)
}

/**
 * Sanitizes phone number input
 * @param phoneNumber - The phone number to sanitize
 * @param maxLength - Maximum allowed length (default: 15)
 * @returns Sanitized phone number
 */
export const sanitizePhoneNumber = (phoneNumber: string, maxLength: number = 15): string => {
  if (typeof phoneNumber !== 'string') {
    return ''
  }
  
  // Only keep digits, *, #, and +
  return phoneNumber
    .replace(/[^0-9*#+]/g, '')
    .slice(0, maxLength)
}

/**
 * Validates geolocation coordinates
 * @param latitude - Latitude value
 * @param longitude - Longitude value
 * @returns true if valid, false otherwise
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    isFinite(latitude) &&
    isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

/**
 * Validates URL parameter value against a whitelist
 * @param value - The value to validate
 * @param whitelist - Array of allowed values
 * @param defaultValue - Default value if validation fails
 * @returns Validated value or default
 */
export const validateWhitelist = <T extends string>(
  value: string,
  whitelist: readonly T[],
  defaultValue: T
): T => {
  if (typeof value !== 'string') {
    return defaultValue
  }
  
  return whitelist.includes(value as T) ? (value as T) : defaultValue
}

/**
 * Validates numeric input
 * @param value - The value to validate
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param defaultValue - Default value if validation fails
 * @returns Validated number or default
 */
export const validateNumeric = (
  value: string | number,
  min: number,
  max: number,
  defaultValue: number
): number => {
  const num = typeof value === 'string' ? parseInt(value, 10) : value
  
  if (isNaN(num) || !isFinite(num) || num < min || num > max) {
    return defaultValue
  }
  
  return num
}

/**
 * Sanitizes text content from API responses before rendering
 * This is a defense-in-depth measure (React already escapes, but this adds extra protection)
 * @param text - The text to sanitize
 * @param maxLength - Maximum allowed length (default: 1000)
 * @returns Sanitized text
 */
export const sanitizeApiResponse = (text: string | null | undefined, maxLength: number = 1000): string => {
  if (!text || typeof text !== 'string') {
    return ''
  }
  
  return sanitizeInput(text, maxLength)
}

/**
 * Validates and sanitizes URL from API responses
 * Only allows http:// and https:// protocols
 * @param url - The URL to validate
 * @returns Validated URL or empty string if invalid
 */
export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url || typeof url !== 'string') {
    return ''
  }
  
  try {
    const urlObj = new URL(url)
    // Only allow http and https protocols
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return ''
    }
    // Return the full URL (URL constructor validates it)
    return urlObj.href
  } catch {
    // Invalid URL
    return ''
  }
}

/**
 * Sanitizes HTML content for safe rendering in blog posts
 * Uses DOMPurify to remove dangerous tags and attributes while preserving safe formatting
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export const sanitizeHtmlContent = (html: string): string => {
  if (typeof html !== 'string') {
    return ''
  }

  // Dynamic import to avoid SSR issues (DOMPurify requires DOM)
  if (typeof window === 'undefined') {
    return html // Return as-is for SSR (will be sanitized on client)
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const DOMPurify = require('dompurify')
  
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'a', 'blockquote', 'code', 'pre',
      'img', 'hr'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'width', 'height', 'class'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  })
}

