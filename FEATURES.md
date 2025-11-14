# Potential Features

## Web Scraper Protection

A feature to prevent web scrapers from finding and indexing specific pages.

### Implementation

The `useNoIndex` hook (`src/hooks/useNoIndex.ts`) is available for use on any page component. It adds `noindex, nofollow` meta tags to prevent search engine indexing.

### Usage

```tsx
import { useNoIndex } from '../hooks/useNoIndex'

const YourPrivatePage = () => {
  useNoIndex() // Prevents search engine indexing
  
  return (
    <Layout>
      {/* your content */}
    </Layout>
  )
}
```

### Additional Steps

1. **robots.txt**: Add `Disallow: /your-path` to `public/robots.txt`
2. **sitemap.xml**: Exclude the page URL from `public/sitemap.xml`

### Notes

- This is a polite request, not security - malicious scrapers can ignore it
- For real security, implement authentication/password protection
- Best used in combination with robots.txt and sitemap exclusion

