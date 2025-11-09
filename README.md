# The Ingredients

A elegant and minimalist website built with Vite, React, and TypeScript.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Features

### Core Features
- Elegant home page with centered, stacked title
- Clean navigation with footer buttons
- Contact, About, and More pages
- Responsive design optimized for mobile and desktop
- Beautiful typography using Playfair Display font
- Dark/Light theme toggle with persistent storage
- Real-time clock display on home page
- Weather display with location-based data
- Dynamic weather-dependent cursors (sunny, rainy, snowy, stormy, foggy, cloudy)
- Custom cursors for interactive elements (clock, weather, location)

### Easter Eggs & Interactive Features

#### 1. Bored Page Input Easter Egg
- Click on "Bored?" title to reveal a text input
- Type "joke", "tell me a joke", or similar phrases to navigate to the Jokes page
- Input is sanitized and secured against XSS attacks

#### 2. Jokes Page
- Accessible via the Bored page easter egg
- Fetches random jokes from JokeAPI
- Filter options: category, type (single/twopart), and content flags
- All inputs validated against whitelists for security

#### 3. "The" Falling Apart Animation
- Long-press (hold for 500ms) on the word "The" on the home page
- Triggers random animations: shake, spin, explode, glitch, wobble, chaos, disintegrate, float
- Character-by-character animations for enhanced visual effect
- Animation resets when released

#### 4. Page Flip Theme Toggle
- Drag from top-left corner (within 100px) diagonally to bottom-right
- Page peels away in real-time following your drag gesture
- Reveals opposite theme color underneath (dark when in light mode, light when in dark mode)
- Visual feedback with grab cursor when hovering over drag zone
- Theme toggles automatically when drag completes (50% threshold)
- Smooth snap-back if released early

### Technical Features
- SEO optimized with meta tags, Open Graph, Twitter Cards, and JSON-LD structured data
- Sitemap.xml and robots.txt for search engine optimization
- Error boundary for graceful error handling
- Input sanitization and validation for security
- API proxy configuration for development and production
- TypeScript for type safety
- Accessibility features (ARIA labels, keyboard navigation)

