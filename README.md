# The Ingredients

An elegant and minimalist website for The Ingredients Collective, built with modern web technologies.

**Live Site:** [theingredients.io](https://theingredients.io)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The development server will start at `http://localhost:5173` (or the next available port).

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **Deployment:** Vercel
- **Styling:** CSS3 with custom animations

## 📁 Project Structure

```
src/
├── components/       # Reusable components (Layout, ErrorBoundary)
├── contexts/        # React contexts (ThemeContext)
├── hooks/           # Custom React hooks
├── pages/           # Page components
│   ├── blog/        # Blog pages
│   └── ...          # Other pages
└── index.css        # Global styles
```

## ✨ Features

### Core Features

- **Responsive Design** - Optimized for mobile, tablet, and desktop
- **Dark/Light Theme** - Persistent theme with cross-route synchronization
- **Real-time Clock** - Live time display on home page
- **Weather Integration** - Location-based weather data with dynamic cursors
- **SEO Optimized** - Meta tags, Open Graph, Twitter Cards, and structured data
- **Accessibility** - ARIA labels, keyboard navigation, semantic HTML

### Interactive Easter Eggs

1. **"The" Falling Apart Animation** (Home page)
   - Long-press (500ms) on "The" to trigger 40+ random animations
   - Character-by-character effects with smooth transitions

2. **Contact Growing Text** (Contact & More pages)
   - Hold the "Contact" title to make it grow and fill the screen
   - Release to navigate to the Contact Me easter egg

3. **Timeline Navigation** (More page)
   - Hold "Timeline" title to navigate to G.O. app
   - Smooth growing animation effect

4. **Page Flip Theme Toggle**
   - Drag from top-left corner to flip the page and toggle theme
   - Real-time visual feedback with smooth animations

5. **Bored Page Easter Egg**
   - Click "Bored?" to reveal hidden input
   - Type "joke" to navigate to Jokes page

### Pages

- **Home** (`/`) - Main landing page with clock, weather, and easter eggs
- **About** (`/about`) - Information about The Ingredients
- **Contact** (`/contact`) - Contact information with easter egg
- **More** (`/more`) - Timeline and additional projects
- **Contact Me** (`/contact-me`) - Interactive phone easter egg (hidden route)
- **Bored** (`/bored`) - Activity suggestions with hidden input
- **Jokes** (`/jokes`) - Random jokes with filtering (hidden route)
- **Blog** (`/blog`) - Blog posts

### Route Integration

- **G.O. Route** (`/go`) - Proxied to external G.O. app via Vercel rewrite
- **Theme Sync** - Themes synchronize between main site and `/go` route

## 🔒 Security

See [SECURITY.md](./SECURITY.md) for detailed security measures including:
- Input sanitization and validation
- XSS protection
- Path traversal prevention
- API request security

## 📝 License

This project is open source and available for public viewing.

## 🤝 Contributing

This is a personal/collective project. For questions or suggestions, please contact [theingredientscollective@gmail.com](mailto:theingredientscollective@gmail.com).

## 📄 Documentation

- [FEATURES.md](./FEATURES.md) - Detailed feature documentation
- [SECURITY.md](./SECURITY.md) - Security measures and best practices
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
