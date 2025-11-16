# Changelog

All notable changes to The Ingredients project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.2] - 2024-12-XX

### Added
- Search easter egg component accessible via 7-second coffee button hold
- Vercel Analytics integration with automatic /go route exclusion
- Weather API fallback system (wttr.in) for improved reliability
- Tide information display for users detected near the ocean
- Mobile touch event support for clock weather toggle
- Debug logging for analytics (development mode only)

### Changed
- Improved Search modal styling with animations and better UX
- Enhanced weather fetching with automatic fallback to secondary API
- Updated coffee button hold time from 5 to 7 seconds
- Moved joke easter egg from Bored page to Search component
- Improved mobile responsiveness for weather display

### Fixed
- Mobile touch events not working for clock weather toggle
- Weather API failures now gracefully fallback to alternative service

### Security
- Added `https://marine-api.open-meteo.com` to Content Security Policy
- Added `https://wttr.in` to Content Security Policy
- All API responses sanitized before display
- Input sanitization in Search component

## [1.3.1] - 2024-12-XX

### Added
- Rate limiting for Google Places API to control costs (5 requests per IP per hour)
- Graceful handling of rate limit errors - OSM results still show when rate limit is reached
- Rate limit headers in API responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Enhanced filtering for corporate chains (convenience stores, gas stations, etc.)
- Filtering for bakeries and patisseries in drink alternatives search
- Filtering for convenience stores and gas stations in both coffee and drink searches

### Changed
- Google Places API endpoint now returns 429 status with helpful error message when rate limit exceeded
- Frontend gracefully handles rate limit errors and continues with OSM results
- Improved result filtering: excludes "Unnamed" places, convenience stores, gas stations, and non-drink-focused businesses
- Stricter filtering for drink alternatives: only shows places clearly focused on tea, smoothies, and non-alcoholic drinks
- Corporate chain list expanded to include 7-Eleven, Circle K, and major gas station brands

## [1.3.0] - 2024-12-XX

### Added
- Coffee page (`/coffee`) with local coffee shop finder feature
- Geolocation API integration for finding nearby coffee shops
- OpenStreetMap (OSM) Overpass API integration for coffee shop search
- Modal interface for displaying coffee shop results with distances
- Address-based map navigation (opens in device's native maps app)
- Corporate chain filtering (excludes Starbucks, Dunkin', etc.)
- Restaurant filtering (excludes restaurants, only shows coffee shops/cafes)
- Distance calculation using Haversine formula
- Responsive modal design with dark mode support
- Character animation fix for "Ingredients" title (improved React key handling)

### Changed
- Improved spacing on Coffee page with section containers
- Updated button text to "Find Nearby!" for better UX
- Enhanced modal styling with better hover states and click feedback

### Security
- Added coordinate validation for Geolocation API
- Implemented OSM API response sanitization
- Added query timeout and radius limits for API calls
- Location data privacy protection (no storage, only used for search)
- Updated security documentation with Geolocation and OSM API details

### Fixed
- Character grouping issue in "Ingredients" animation (fixed React key uniqueness)

## [1.2.0] - 2024-12-XX

### Added
- Theme synchronization between main site and `/go` route
- Cross-tab/window theme sync via storage events
- Custom `themechange` event for same-window route navigation
- G.O. route integration in footer navigation
- G.O. link in More page Timeline section
- Contact section in More page with easter egg
- Growing text easter eggs for Contact and Timeline titles
- Minimum hold time (500ms) for easter egg navigation to prevent accidental triggers
- Improved touch and mouse event handling for animations
- Fallback navigation for ContactMe back button
- Local development redirect for G.O. button (redirects to live site)

### Fixed
- Animation continues while holding down (fixed mouse leave and touch move handlers)
- Accidental navigation to `/contact-me` and `/go` routes
- ContactMe back button navigation (now uses browser history)
- Theme flash on page load
- Touch event handling during animations

### Changed
- Restructured More page with separate Timeline and Contact sections
- Updated footer navigation (removed Contact, added G.O.)
- Improved spacing on About page
- Enhanced theme context with storage event listeners
- Updated CSS to support both `data-theme` and `.theme-dark` methods

### Security
- Added minimum hold time checks to prevent accidental easter egg triggers
- Improved input validation
- Enhanced error handling

## [1.1.0] - Previous Release

### Added
- Contact page with growing text easter egg
- ContactMe phone easter egg page
- More page with Timeline section
- Weather display with location detection
- Dynamic weather-dependent cursors
- Multiple animation variants for "The" easter egg
- Page flip theme toggle
- Bored page with hidden input easter egg
- Jokes page with filtering

### Fixed
- Console.log statements wrapped in dev checks
- Missing useEffect dependencies
- Error boundary implementation
- TypeScript environment types

## [1.0.0] - Initial Release

### Added
- Basic site structure
- Home, About, Contact pages
- Dark/Light theme toggle
- Responsive design
- SEO optimization
- Error boundary
- Basic accessibility features

