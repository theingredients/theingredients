# Features - The Ingredients

Complete documentation of all features and interactive elements.

## 🎨 Core Features

### Responsive Design
- Mobile-first approach with breakpoints at 768px and 480px
- Touch-optimized interactions
- Adaptive layouts for all screen sizes

### Theme System
- **Light/Dark Mode** - Toggle between themes
- **Persistent Storage** - Theme preference saved in localStorage
- **Cross-Route Sync** - Themes synchronize between main site and `/go` route
- **No Flash** - Theme applied immediately on page load
- **Storage Events** - Syncs across browser tabs/windows

### Typography
- **Playfair Display** - Elegant serif font from Google Fonts
- **Responsive Sizing** - Scales appropriately on mobile devices
- **Letter Spacing** - Optimized for readability

### Navigation
- **Footer Navigation** - Home, About, G.O., More
- **Smart Routing** - Context-aware navigation with history preservation
- **Back Button Support** - Proper browser history handling

## 🎮 Interactive Easter Eggs

### 1. "The" Falling Apart Animation
**Location:** Home page (`/`)

**How to Activate:**
- Long-press (hold for 500ms) on the word "The" in the title
- Works on both desktop (mouse) and mobile (touch)

**Features:**
- 40+ random animation variants including:
  - shake, spin, explode, glitch, wobble, chaos
  - disintegrate, float, bounce, wave, pulse, jitter
  - stretch, flip, slide, zoom, elastic, orbit
  - matrix, blur, squash, twirl, pop, ripple
  - tumble, rainbow, spiral, morph, scatter
  - vortex, melt, teleport, zigzag, spiral-in
  - gravity, magnetic, dance, swirl, flicker-fast, break-apart
- Character-by-character animations with staggered delays
- Animation continues while holding (fixed mouse/touch handling)
- Resets smoothly when released

**Technical Details:**
- Uses `requestAnimationFrame` for smooth 60fps animations
- CSS keyframe animations with infinite loops
- State management prevents accidental triggers

### 2. Contact Growing Text Easter Egg
**Location:** Contact page (`/contact`) and More page (`/more`)

**How to Activate:**
- Long-press (hold for 500ms) on the "Contact" title
- Text grows to fill the entire screen
- Release to navigate to `/contact-me` easter egg

**Features:**
- Smooth scaling animation using `requestAnimationFrame`
- Ease-out cubic easing for natural motion
- Continues growing while holding
- Minimum 500ms hold time prevents accidental navigation
- Works on both desktop and mobile

### 3. Timeline Navigation Easter Egg
**Location:** More page (`/more`)

**How to Activate:**
- Long-press (hold for 500ms) on the "Timeline" title
- Text grows to fill the screen
- Release to navigate to `/go` route

**Features:**
- Same smooth growing animation as Contact easter egg
- Minimum hold time prevents accidental navigation
- Proper history management

### 4. Page Flip Theme Toggle
**Location:** All pages (via Layout component)

**How to Activate:**
- **Desktop:** Drag from top-left corner (within 120px) diagonally to bottom-right
- **Mobile:** Swipe from right edge (within 100px) leftward

**Features:**
- Real-time visual feedback following drag gesture
- Page peels away revealing opposite theme underneath
- Smooth snap-back if released early
- Automatic theme toggle when drag completes (40% threshold)
- Velocity detection for quick swipes
- Grab cursor indicator in drag zone

**Technical Details:**
- 3D CSS transforms with perspective
- Touch and mouse event handling
- Angle and distance validation
- Smooth transitions with cubic-bezier easing

### 5. Bored Page Input Easter Egg
**Location:** Bored page (`/bored`)

**How to Activate:**
- Click on the "Bored?" title
- Hidden text input appears
- Type "joke", "tell me a joke", or similar phrases
- Automatically navigates to Jokes page

**Features:**
- Input sanitization (removes dangerous characters)
- Length limitation (100 characters max)
- Keyword matching for navigation
- Secure against XSS attacks

### 6. Contact Me Phone Easter Egg
**Location:** `/contact-me` (hidden route)

**How to Access:**
- Activate Contact easter egg on Contact or More pages
- Hold "Contact" title for 500ms+ and release

**Features:**
- Interactive phone interface with keypad
- DTMF tone generation for button presses
- Real-time audio visualization (oscilloscope)
- Microphone input with visual feedback
- Device selection for audio input
- Portrait orientation lock on mobile
- Proper back navigation to previous page

## 📄 Pages

### Home (`/`)
- Real-time clock display
- Weather information with location detection
- Dynamic weather-dependent cursors
- "The" falling apart animation easter egg
- Click counter easter egg (7 clicks → Bored page)

### About (`/about`)
- Information about The Ingredients Collective
- Links to Web APIs documentation
- Contact email link

### Contact (`/contact`)
- Contact information
- Email button
- "Create Audio With Us" button (links to The OR app)
- Growing text easter egg (navigates to Contact Me)

### More (`/more`)
- **Timeline Section:**
  - G.O. (beta) - geotrack to text
  - The OR (beta) - audio fun
  - The MIDI (alpha) - MIDI fun
  - The DO (alpha) - digital organizing
  - The Future
  - Timeline easter egg (navigates to G.O.)
  
- **Contact Section:**
  - Contact information
  - Email and audio buttons
  - Contact easter egg (navigates to Contact Me)

### Bored (`/bored`)
- Activity suggestions from Bored API
- Filter by type and participants
- Hidden input easter egg
- Click counter navigation (7 clicks)

### Jokes (`/jokes`)
- Random jokes from JokeAPI
- Filter by category, type, and content flags
- Accessible via Bored page easter egg

### Blog (`/blog`)
- Blog posts and articles

## 🔗 Route Integration

### G.O. Route (`/go`)
- Proxied to external G.O. app via Vercel rewrite
- Configured in `vercel.json`
- Theme synchronization with main site
- Local development redirects to live site

## 🎯 Technical Features

### Performance
- Code splitting with Vite
- Optimized asset loading
- Smooth 60fps animations
- Efficient React rendering

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Semantic HTML structure
- Screen reader friendly

### SEO
- Meta tags for all pages
- Open Graph tags for social sharing
- Twitter Card support
- JSON-LD structured data
- Sitemap.xml and robots.txt

### Error Handling
- Error Boundary component
- Graceful error messages
- No sensitive information in errors

### Security
- Input sanitization
- XSS protection
- Path traversal prevention
- API request validation
- No sensitive data in client code

## 🛠️ Development Features

### TypeScript
- Full type safety
- Proper interface definitions
- Environment variable types

### Build System
- Vite for fast development
- TypeScript compilation
- Production optimizations
- Asset bundling

### Code Quality
- ESLint configuration
- TypeScript strict mode
- Consistent code style
- Component organization
