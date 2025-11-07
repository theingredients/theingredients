import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Home from './pages/Home'
import Contact from './pages/Contact'
import About from './pages/About'
import More from './pages/More'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/more" element={<More />} />
        </Routes>
      </Router>
    </ThemeProvider>
  )
}

export default App

