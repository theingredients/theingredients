/**
 * URL validation utility to prevent open redirect vulnerabilities
 * Validates external URLs against a whitelist
 */

const ALLOWED_EXTERNAL_URLS = [
  'https://theingredients.io/go',
  'https://or-six.vercel.app/',
  'https://thego-navy.vercel.app/'
]

/**
 * Validates if an external URL is allowed
 * @param url - The URL to validate
 * @returns true if the URL is in the whitelist, false otherwise
 */
export const isValidExternalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    
    // Check if URL matches any allowed external URL
    return ALLOWED_EXTERNAL_URLS.some(allowed => {
      const allowedObj = new URL(allowed)
      // Match origin and ensure pathname starts with allowed pathname
      return urlObj.origin === allowedObj.origin && 
             urlObj.pathname.startsWith(allowedObj.pathname)
    })
  } catch {
    // Invalid URL format
    return false
  }
}

/**
 * Safely redirects to an external URL if it's in the whitelist
 * @param url - The URL to redirect to
 * @param fallback - Optional fallback URL if validation fails
 * @returns true if redirect was successful, false if validation failed
 */
export const safeRedirect = (url: string, fallback?: string): boolean => {
  if (isValidExternalUrl(url)) {
    window.location.href = url
    return true
  }
  
  if (fallback && isValidExternalUrl(fallback)) {
    window.location.href = fallback
    return true
  }
  
  console.warn('Redirect blocked: URL not in whitelist', url)
  return false
}

