import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import ContactMe from './pages/ContactMe'
import About from './pages/About'
import More from './pages/More'
import Bored from './pages/Bored'
import Jokes from './pages/Jokes'
import Blog from './pages/blog/Blog'
import BlogPost from './pages/blog/BlogPost'
import Coffee from './pages/Coffee'
import BirthdayInvite from './pages/BirthdayInvite'
import BirthdayGames from './pages/BirthdayGames'

function App() {
  return (
    <ErrorBoundary>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact-me" element={<ContactMe />} />
          <Route path="/about" element={<About />} />
          <Route path="/more" element={<More />} />
          <Route path="/bored" element={<Bored />} />
          <Route path="/jokes" element={<Jokes />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/coffee" element={<Coffee />} />
          <Route path="/jda11202025" element={<BirthdayInvite />} />
          <Route path="/bdaygame" element={<BirthdayGames />} />
        </Routes>
      </Router>
      <Analytics
        beforeSend={(event) => {
          // Exclude /go route and any paths starting with /go from analytics
          if (event.url.includes('/go')) {
            if (import.meta.env.DEV) {
              console.log('[Analytics] Excluding /go route:', event.url)
            }
            return null // Don't send this event
          }
          if (import.meta.env.DEV) {
            console.log('[Analytics] Tracking:', event.url)
          }
          return event // Send all other events
        }}
      />
    </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

