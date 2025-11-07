import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    document.body.className = `theme-${theme}`
  }, [theme])

  const handleNavigation = (path: string) => {
    if (location.pathname === path) {
      toggleTheme()
    } else {
      navigate(path)
    }
  }

  return (
    <div className={`layout theme-${theme}`}>
      <header className="header">
        {/* Empty header for now */}
      </header>
      
      <main className="main-content">
        {children}
      </main>
      
      <footer className="footer">
        <button onClick={() => handleNavigation('/')} className="footer-button">
          Home
        </button>
        <button onClick={() => handleNavigation('/about')} className="footer-button">
          About
        </button>
        <button onClick={() => handleNavigation('/contact')} className="footer-button">
          Contact
        </button>
        <button onClick={() => handleNavigation('/more')} className="footer-button">
          More
        </button>
      </footer>
    </div>
  )
}

export default Layout

