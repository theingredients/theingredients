# Security Documentation - The Ingredients

This document outlines the security measures implemented in The Ingredients website.

## 🔒 Security Overview

The Ingredients is a client-side React application with no backend server. All security measures focus on:
- Input validation and sanitization
- XSS (Cross-Site Scripting) prevention
- Path traversal prevention
- API request security
- Client-side data protection

## ✅ Implemented Security Measures

### Input Security

#### Text Input Sanitization
**Location:** `src/pages/Bored.tsx`

- **Dangerous Character Removal:** Strips `<`, `>`, `"`, `'`, `&` characters
- **Length Limitation:** Maximum 100 characters enforced
- **No Direct Rendering:** Input only used for keyword matching, never rendered to DOM
- **Whitelist Validation:** Only predefined safe keywords trigger actions

```typescript
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '').slice(0, 100)
}
```

#### Dropdown/Select Validation
**Locations:** `src/pages/Bored.tsx`, `src/pages/Jokes.tsx`

- **Whitelist Validation:** All filter values validated against predefined whitelists
- **URL Parameter Encoding:** Using `URLSearchParams` for automatic encoding
- **Path Traversal Prevention:** Category values validated before URL construction

**Bored Page Whitelists:**
- `filterType`: `['education', 'recreational', 'social', 'charity', 'cooking', 'relaxation', 'busywork']`
- `filterParticipants`: Integer between 1-8

**Jokes Page Whitelists:**
- `filterCategory`: `['Any', 'Programming', 'Misc', 'Dark', 'Pun', 'Spooky', 'Christmas']`
- `filterType`: `['single', 'twopart']`
- `blacklistFlags`: `['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit']`

### XSS (Cross-Site Scripting) Protection

1. **Input Sanitization** - Dangerous characters removed from all text inputs
2. **React's Built-in Protection** - React automatically escapes values when rendering
3. **HTML Content Sanitization** - Blog post HTML content sanitized using DOMPurify before rendering
   - **Location:** `src/pages/blog/BlogPost.tsx`, `src/utils/inputSanitizer.ts`
   - **Library:** DOMPurify (industry-standard HTML sanitizer)
   - **Allowed Tags:** Only safe formatting tags (p, h1-h6, ul, ol, li, strong, em, a, blockquote, code, pre, img, hr)
   - **Removed:** All dangerous tags (script, iframe, object, embed, etc.) and event handlers
   - **URL Validation:** Links validated to prevent javascript: and data: protocol attacks
   - **Implementation:** `sanitizeHtmlContent()` function in `inputSanitizer.ts` used before `dangerouslySetInnerHTML`
4. **Content Security** - All user inputs are validated, never directly rendered

### Path Traversal Protection

1. **Category Whitelist** - API category values validated against whitelist before URL construction
2. **URL Encoding** - `encodeURIComponent()` used for all path segments
3. **Default Fallback** - Invalid categories default to safe values instead of causing errors

### API Request Security

1. **URL Encoding** - All user inputs properly encoded using `URLSearchParams` and `encodeURIComponent`
2. **Whitelist Validation** - Only validated values reach external APIs
3. **Error Handling** - Proper error boundaries prevent information leakage
4. **No Sensitive Data** - No API keys or sensitive information in client-side code
5. **Proxy Configuration** - API calls go through Vercel proxy (configured in `vercel.json`)
6. **Geolocation API Security:**
   - Coordinates validated using `isValidCoordinates()` before API calls
   - Only valid latitude (-90 to 90) and longitude (-180 to 180) values accepted
   - Invalid coordinates rejected with error messages
   - User permission required before any location access
7. **OSM Overpass API Security:**
   - Query parameters sanitized and validated
   - Search radius limited to 5km (5000 meters) to prevent excessive queries
   - Query timeout set to 25 seconds to prevent hanging requests
   - All API responses sanitized using `sanitizeApiResponse()` before rendering
   - Response structure validated before processing (checks for `data.elements` array)
   - No user location data stored or logged

### Injection Attack Prevention

1. **Parameter Validation** - All URL parameters validated against whitelists
2. **Type Checking** - Numeric values parsed and validated
3. **Array Filtering** - Multi-value parameters filtered to only include valid values

### Additional Security Best Practices

1. ✅ **External Links** - All external links use `rel="noopener noreferrer"`
2. ✅ **Error Messages** - Generic error messages don't expose system details
3. ✅ **No Console Logs in Production** - All console statements wrapped in `if (import.meta.env.DEV)`
4. ✅ **HTTPS** - All API calls use HTTPS (via proxy)
5. ✅ **CORS** - API calls go through proxy, avoiding direct CORS issues
6. ✅ **Environment Variables** - `.env` files excluded from version control
7. ✅ **No Hardcoded Secrets** - No API keys, passwords, or tokens in codebase

### Easter Egg Security

- **Minimum Hold Time** - All easter eggs require 500ms hold to prevent accidental triggers
- **Mouse Button State Check** - Animations only stop if mouse button is actually released
- **Touch Event Handling** - Proper touch event management prevents accidental navigation

## 🔐 Data Protection

### LocalStorage
- **Theme Preference** - Stored in localStorage with key `'theme'`
- **No Sensitive Data** - Only theme preference stored, no user data
- **Same-Origin Policy** - localStorage isolated to theingredients.io domain

### No User Data Collection
- No user accounts or authentication
- No personal information collected
- Vercel Analytics integrated with /go route exclusion for privacy
- **Geolocation Data:**
  - Location data only requested when user explicitly clicks "Find Nearby!" button
  - Location coordinates used only for local search functionality
  - Location data never stored in localStorage, cookies, or any persistent storage
  - Location data only sent to OSM Overpass API for search queries
  - No location data transmitted to any other third-party services
  - Location permission can be revoked by user at any time through browser settings

### Browser Permission Management
**Location:** `src/pages/ContactMe.tsx`, `src/pages/Home.tsx`, `src/pages/Coffee.tsx`

- **Microphone Permissions:** Properly cleaned up when:
  - Component unmounts (navigation away)
  - Page becomes hidden (tab switch, window minimize)
  - Browser closes/refreshes (beforeunload event)
  - User manually disables microphone
- **Geolocation Permissions:** 
  - User must explicitly grant permission (no automatic requests)
  - Location data only used for local search functionality
  - Coordinates validated using `isValidCoordinates()` before use
  - Location data never stored or transmitted to third parties (except OSM API for search)
  - Permission denied gracefully handled with user-friendly error messages
  - Location timeout set to 10 seconds to prevent hanging requests
- **MediaStreamSource Disconnection:** All audio sources properly disconnected
- **Resource Cleanup:** All audio contexts, streams, and animation frames cleaned up

## 🛡️ Security Headers

The following security headers should be configured at the hosting level (Vercel):

- **Content Security Policy (CSP)** - Recommended for future implementation
- **X-Frame-Options** - Prevent clickjacking
- **X-Content-Type-Options** - Prevent MIME sniffing
- **Referrer-Policy** - Control referrer information

## 📋 Security Checklist

- [x] Input sanitization implemented
- [x] XSS protection in place
- [x] Path traversal prevention
- [x] API request validation
- [x] No sensitive data in code
- [x] Error handling implemented
- [x] External links secured
- [x] Console logs removed from production
- [x] HTTPS enforced
- [x] Microphone cleanup on page navigation
- [x] Browser permission resource management
- [x] Geolocation coordinate validation
- [x] OSM API response sanitization
- [x] Location data privacy protection
- [x] CSP headers implemented in vercel.json
- [x] Rate limiting for Google Places API
- [x] Vercel Analytics with route exclusion
- [x] Search component input sanitization
- [x] Weather API fallback system
- [x] Marine API integration for tide data
- [x] Blog post HTML sanitization with DOMPurify

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please email [theingredientscollective@gmail.com](mailto:theingredientscollective@gmail.com) instead of using the issue tracker.

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

## 🔄 Regular Security Maintenance

1. **Dependency Updates** - Regularly update npm packages
2. **Security Audits** - Run `npm audit` periodically
3. **Code Reviews** - Review all code changes for security implications
4. **Penetration Testing** - Consider periodic security testing

## ⚠️ Known Limitations

1. **Client-Side Only** - All security measures are client-side
2. **No Authentication** - No user authentication system
3. **Public Repository** - Code is publicly viewable (no secrets should be committed)
4. **API Rate Limiting** - Relies on external API rate limiting

## 🔮 Future Security Enhancements

1. **Content Security Policy Headers** - Add CSP headers in production
2. **Rate Limiting** - Implement client-side rate limiting for API calls
3. **Input Validation Library** - Consider using `validator.js` for more robust validation
4. **Security Headers** - Configure security headers at hosting level
5. **Regular Security Audits** - Schedule periodic security reviews
