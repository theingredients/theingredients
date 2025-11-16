# Security Recommendations for The Ingredients

This document outlines additional security recommendations beyond what's already implemented in [SECURITY.md](./SECURITY.md).

## 🔴 High Priority Recommendations

### 1. **Content Security Policy (CSP) Headers**
**Status:** ✅ Implemented  
**Priority:** High  
**Risk:** XSS attacks, data injection

**Recommendation:**
Add CSP headers via Vercel configuration or `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.bigdatacloud.net https://api.open-meteo.com https://api.weather.gov https://bored-api.appbrewery.com https://v2.jokeapi.dev https://api.stripe.com https://checkout.stripe.com https://overpass-api.de; frame-src https://checkout.stripe.com; media-src 'self';"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

**Note:** Adjust CSP based on your actual needs. The above is a starting point.

### 2. **Update Dependencies with Known Vulnerabilities**
**Status:** ⚠️ Partially Addressed  
**Priority:** High  
**Risk:** Development server security issues

**Note:** Dependencies are up to date. The remaining vulnerability requires Vite 7 (breaking change). Since it only affects the dev server, not production builds, this is acceptable for now. Monitor for Vite 7 migration when ready.

**Current Issues:**
- `esbuild <=0.24.2` (moderate severity)
- `vite 0.11.0 - 6.1.6` depends on vulnerable esbuild

**Recommendation:**
```bash
# Review breaking changes first
npm audit fix --force

# Or manually update to latest versions
npm update vite @vitejs/plugin-react
```

**Note:** The vulnerability affects the development server, not production builds, but should still be addressed.

### 3. **Geolocation Data Validation**
**Status:** ✅ Implemented  
**Priority:** High  
**Risk:** Invalid coordinate injection

**Current Implementation:**
```typescript:src/pages/Home.tsx
const { latitude, longitude } = position.coords
```

**Recommendation:**
Add validation for geolocation coordinates:

```typescript
const { latitude, longitude } = position.coords

// Validate coordinates are within valid ranges
if (
  typeof latitude !== 'number' || 
  typeof longitude !== 'number' ||
  latitude < -90 || latitude > 90 ||
  longitude < -180 || longitude > 180 ||
  !isFinite(latitude) || !isFinite(longitude)
) {
  throw new Error('Invalid geolocation coordinates')
}
```

### 4. **Microphone Permission Cleanup** ✅
**Status:** Just Fixed  
**Priority:** High  
**Risk:** Privacy violation, resource leaks

**Implementation:**
- ✅ Added proper MediaStreamSource disconnection
- ✅ Added visibility change handler
- ✅ Added beforeunload handler
- ✅ Centralized cleanup logic

**Recommendation:** Document this in SECURITY.md as implemented.

## 🟡 Medium Priority Recommendations

### 5. **Rate Limiting for API Calls**
**Status:** ✅ Implemented  
**Priority:** Medium  
**Risk:** API abuse, potential costs

**Recommendation:**
Implement client-side rate limiting:

```typescript
// Example rate limiter utility
const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests: number[] = []
  return () => {
    const now = Date.now()
    const windowStart = now - windowMs
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= maxRequests) {
      return false // Rate limit exceeded
    }
    
    recentRequests.push(now)
    requests.length = 0
    requests.push(...recentRequests)
    return true
  }
}

// Usage in API calls
const rateLimiter = createRateLimiter(10, 60000) // 10 requests per minute
if (!rateLimiter()) {
  setError('Too many requests. Please wait a moment.')
  return
}
```

### 6. **Input Validation Enhancement**
**Status:** Basic Implementation  
**Priority:** Medium  
**Risk:** Edge cases in input sanitization

**Current Implementation:**
```typescript
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>\"'&]/g, '').slice(0, 100)
}
```

**Recommendation:**
Consider using a library like `DOMPurify` or `validator.js` for more robust validation:

```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

```typescript
import DOMPurify from 'dompurify'

const sanitizeInput = (input: string): string => {
  // Remove HTML tags and dangerous content
  const sanitized = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  })
  return sanitized.slice(0, 100)
}
```

### 7. **Error Message Sanitization**
**Status:** Partially Implemented  
**Priority:** Medium  
**Risk:** Information leakage through error messages

**Current Implementation:**
Error messages are generic, but API error responses might contain sensitive data.

**Recommendation:**
Sanitize error messages before displaying:

```typescript
const sanitizeError = (error: unknown): string => {
  if (error instanceof Error) {
    // Don't expose stack traces or internal details
    const message = error.message
    // Only show user-friendly messages
    if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
      return 'Network error. Please check your connection and try again.'
    }
    return 'An error occurred. Please try again.'
  }
  return 'An unexpected error occurred.'
}
```

### 8. **External URL Validation**
**Status:** ✅ Implemented  
**Priority:** Medium  
**Risk:** Open redirect vulnerabilities

**Current Implementation:**
```typescript:src/components/Layout.tsx
window.location.href = 'https://theingredients.io/go'
```

**Recommendation:**
Validate external URLs against a whitelist:

```typescript
const ALLOWED_EXTERNAL_URLS = [
  'https://theingredients.io/go',
  'https://or-six.vercel.app/',
  'https://thego-navy.vercel.app/'
]

const isValidExternalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return ALLOWED_EXTERNAL_URLS.some(allowed => {
      const allowedObj = new URL(allowed)
      return urlObj.origin === allowedObj.origin && 
             urlObj.pathname.startsWith(allowedObj.pathname)
    })
  } catch {
    return false
  }
}

// Usage
if (isValidExternalUrl(targetUrl)) {
  window.location.href = targetUrl
} else {
  console.error('Invalid external URL')
}
```

## 🟢 Low Priority Recommendations

### 9. **Subresource Integrity (SRI) for External Resources**
**Status:** Not Implemented  
**Priority:** Low  
**Risk:** Compromised CDN resources

**Recommendation:**
Add SRI hashes for external scripts/stylesheets if you add any in the future.

### 10. **Security Headers Monitoring**
**Status:** Not Implemented  
**Priority:** Low  
**Risk:** Missing security headers

**Recommendation:**
Use tools like [SecurityHeaders.com](https://securityheaders.com) to monitor your security headers.

### 11. **Regular Security Audits**
**Status:** Manual  
**Priority:** Low  
**Risk:** Outdated dependencies

**Recommendation:**
Set up automated dependency scanning:

```bash
# Add to package.json scripts
"scripts": {
  "security:audit": "npm audit",
  "security:fix": "npm audit fix"
}
```

Consider using:
- GitHub Dependabot
- Snyk
- npm audit in CI/CD

### 12. **HTTPS Enforcement**
**Status:** Should be enforced  
**Priority:** Low  
**Risk:** Man-in-the-middle attacks

**Recommendation:**
Ensure Vercel enforces HTTPS (should be default). Add HSTS header:

```json
{
  "key": "Strict-Transport-Security",
  "value": "max-age=31536000; includeSubDomains"
}
```

## 📋 Implementation Checklist

### Immediate Actions (This Week)
- [x] Update vulnerable dependencies (esbuild/vite) - Dependencies up to date, Vite 7 requires breaking changes
- [x] Add geolocation coordinate validation
- [x] Document microphone cleanup in SECURITY.md
- [x] Add CSP and security headers
- [x] Implement rate limiting
- [x] Add external URL validation

### Short Term (This Month)
- [x] Implement CSP headers
- [x] Add rate limiting for API calls
- [ ] Enhance input validation (consider DOMPurify) - Optional enhancement
- [x] Add external URL validation

### Long Term (Next Quarter)
- [ ] Set up automated security scanning
- [ ] Implement comprehensive error sanitization
- [ ] Add security headers monitoring
- [ ] Regular security review process

## 🔍 Additional Security Considerations

### 1. **API Response Validation**
Validate all API responses before using them:

```typescript
const validateApiResponse = (data: unknown): data is ExpectedType => {
  // Type guard to ensure response matches expected structure
  return (
    typeof data === 'object' &&
    data !== null &&
    'expectedProperty' in data
  )
}
```

### 2. **LocalStorage Security**
Current implementation only stores theme preference (safe). If you add more localStorage usage:
- Never store sensitive data
- Validate data on read
- Use expiration for temporary data

### 3. **Third-Party Scripts**
Currently using Google Fonts. If adding analytics or other third-party scripts:
- Review privacy policies
- Use CSP to restrict what they can do
- Consider self-hosting when possible

### 4. **Browser Feature Permissions**
You're using:
- ✅ Geolocation (with user permission)
- ✅ Microphone (with user permission, now properly cleaned up)

**Recommendation:** Document all permission usage and ensure proper cleanup.

## 📚 Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP React Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/React_Security_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Security Best Practices](https://developer.mozilla.org/en-US/docs/Web/Security)

## 🔄 Review Schedule

- **Weekly:** Dependency updates (`npm audit`)
- **Monthly:** Security headers check
- **Quarterly:** Full security audit
- **Annually:** Penetration testing (if budget allows)

---

**Last Updated:** After microphone cleanup implementation  
**Next Review:** Next month

