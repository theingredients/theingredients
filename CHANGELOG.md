# Changelog

All notable changes to The Ingredients project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

