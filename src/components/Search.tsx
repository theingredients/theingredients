import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sanitizeInput } from '../utils/inputSanitizer'
import Icon from './Icon'
import './Search.css'

interface SearchProps {
  isOpen: boolean
  onClose: () => void
}

const Search = ({ isOpen, onClose }: SearchProps) => {
  const [inputValue, setInputValue] = useState('')
  const MAX_INPUT_LENGTH = 500 // Maximum input length
  const navigate = useNavigate()

  // Joke easter egg: navigate to /jokes if user types joke-related keywords
  useEffect(() => {
    if (!inputValue.trim()) return

    const sanitized = sanitizeInput(inputValue)
    const normalizedInput = sanitized.toLowerCase().trim()
    const jokeKeywords = ['joke', 'tell me a joke', 'jokes', 'make me laugh', 'funny', 'humor']
    
    if (jokeKeywords.some(keyword => normalizedInput.includes(keyword))) {
      navigate('/jokes')
      setInputValue('')
      onClose()
    }
  }, [inputValue, navigate, onClose])

  if (!isOpen) return null

  const handleClose = () => {
    setInputValue('')
    onClose()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    // Sanitize input to prevent XSS attacks
    const sanitized = sanitizeInput(rawValue, MAX_INPUT_LENGTH)
    setInputValue(sanitized)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  return (
    <div className="search-overlay" onClick={handleClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-content">
          <button 
            className="search-close"
            onClick={handleClose}
            aria-label="Close modal"
          >
            <Icon name="x" size={24} ariaHidden={true} />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter text here..."
            className="search-input"
            autoFocus
            maxLength={MAX_INPUT_LENGTH}
            aria-label="Search input - try typing 'joke'"
          />
        </div>
      </div>
    </div>
  )
}

export default Search

