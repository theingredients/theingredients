import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import ContactMe from './pages/ContactMe'
import About from './pages/About'
import More from './pages/More'
import Bored from './pages/Bored'
import Jokes from './pages/Jokes'
import Blog from './pages/blog/Blog'

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
        </Routes>
      </Router>
    </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App

