import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
  }
  return 'light'
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    // Sync with localStorage and apply to body
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme)
      if (document.body) {
        document.body.className = `theme-${theme}`
      }
      document.documentElement.setAttribute('data-theme', theme)
      
      // Dispatch custom event for same-window listeners (for route changes within same tab)
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
      
      // Update UI elements if function exists
      if (typeof (window as any).updateThemeUI === 'function') {
        (window as any).updateThemeUI(theme)
      }
    }
  }, [theme])

  // Listen for storage events from other tabs/windows
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'theme' && e.newValue) {
          const newTheme = e.newValue as Theme
          if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme)
          }
        }
      }
      
      window.addEventListener('storage', handleStorageChange)
      return () => {
        window.removeEventListener('storage', handleStorageChange)
      }
    }
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === 'light' ? 'dark' : 'light'
      return newTheme
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

