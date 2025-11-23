import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Layout from '../components/Layout'
import { sanitizeInput } from '../utils/inputSanitizer'
import { useTheme } from '../contexts/ThemeContext'
import './PageStyles.css'
import './BirthdayGames.css'
import './BirthdayInvite.css'

const BirthdayGames = () => {
  const navigate = useNavigate()
  const { toggleTheme } = useTheme()
  const [isContentExploding] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [isQrCollapsed, setIsQrCollapsed] = useState(false)
  const [playerName, setPlayerName] = useState<string>('')
  const [playerNameInput, setPlayerNameInput] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)
  const [currentGame, setCurrentGame] = useState<string | null>(null)
  const [statements, setStatements] = useState<string[]>(['', '', ''])
  const [statementErrors, setStatementErrors] = useState<string[]>(['', '', ''])
  const [submittedUsers, setSubmittedUsers] = useState<Record<string, { playerName: string; statements: string[]; submittedAt: number }>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSubmissionsList, setShowSubmissionsList] = useState(false)
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())
  const [showPlayerNames, setShowPlayerNames] = useState(false)
  const [showRevealConfirmation, setShowRevealConfirmation] = useState(false)
  const [songs, setSongs] = useState<Array<{ id: string; songName: string; artist: string; addedBy: string; addedAt: number; videoId?: string }>>([])
  const [newSongName, setNewSongName] = useState('')
  const [newSongArtist, setNewSongArtist] = useState('')
  const [songError, setSongError] = useState<string | null>(null)
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState('')
  const [youtubeResults, setYoutubeResults] = useState<Array<{ videoId: string; title: string; channelTitle: string; thumbnail: string }>>([])
  const [isSearchingYoutube, setIsSearchingYoutube] = useState(false)
  const [youtubeSearchError, setYoutubeSearchError] = useState<string | null>(null)
  const [movies, setMovies] = useState<string[]>(['', '', ''])
  const [movieErrors, setMovieErrors] = useState<string[]>(['', '', ''])
  const [goatSubmissions, setGoatSubmissions] = useState<Record<string, { playerName: string; movies: string[]; submittedAt: number }>>({})
  const [isSubmittingGOAT, setIsSubmittingGOAT] = useState(false)
  const [showGOATSubmissionsList, setShowGOATSubmissionsList] = useState(false)
  const [expandedGOATSubmissions, setExpandedGOATSubmissions] = useState<Set<string>>(new Set())
  const [showGOATPlayerNames, setShowGOATPlayerNames] = useState(false)
  const [showGOATRevealConfirmation, setShowGOATRevealConfirmation] = useState(false)
  const [userComment, setUserComment] = useState<string>('')
  const [comments, setComments] = useState<Record<string, string[]>>({})
  const [isSavingComment, setIsSavingComment] = useState(false)
  const [commentSaveSuccess, setCommentSaveSuccess] = useState(false)
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(true)
  const [longPressSongId, setLongPressSongId] = useState<string | null>(null)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const [revealedSongs, setRevealedSongs] = useState<Set<string>>(new Set())

  // Set page title and load player name when component mounts
  useEffect(() => {
    const originalTitle = document.title
    document.title = "Birthday Games - The Ingredients"
    
    // Generate the full URL for the QR code
    const currentUrl = window.location.origin + window.location.pathname
    setQrUrl(currentUrl)
    
    // Load saved player name from localStorage
    const savedPlayerName = localStorage.getItem('birthday-games-player-name')
    if (savedPlayerName) {
      setPlayerName(savedPlayerName)
    }
    
    // Load songs from API (with localStorage fallback)
    const loadSongs = async () => {
      try {
        console.log('🔄 [INITIAL LOAD] Fetching songs from API...')
        const response = await fetch('/api/birthday-games?gameType=who-picked')
        if (response.ok) {
          const data = await response.json()
          const songs = data.songs || []
          console.log('✅ [INITIAL LOAD] Fetched songs from API:', songs.length, 'songs')
          console.log('📋 [INITIAL LOAD] All songs:', JSON.stringify(songs, null, 2))
          setSongs(songs)
          // Also save to localStorage as backup
          localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(songs))
        } else {
          console.warn('⚠️ [INITIAL LOAD] API failed, falling back to localStorage')
          // Fallback to localStorage if API fails
          const savedSongs = localStorage.getItem('birthday-games-who-picked-songs')
          if (savedSongs) {
            try {
              const songs = JSON.parse(savedSongs)
              console.log('📦 [INITIAL LOAD] Loaded songs from localStorage:', songs.length, 'songs')
              console.log('📋 [INITIAL LOAD] All songs from localStorage:', JSON.stringify(songs, null, 2))
              setSongs(songs)
            } catch (error) {
              console.error('❌ [INITIAL LOAD] Error loading songs from localStorage:', error)
            }
          } else {
            console.log('📭 [INITIAL LOAD] No songs found in localStorage')
          }
        }
      } catch (error) {
        console.error('❌ [INITIAL LOAD] Error loading songs from API:', error)
        // Fallback to localStorage if API fails
        const savedSongs = localStorage.getItem('birthday-games-who-picked-songs')
        if (savedSongs) {
          try {
            const songs = JSON.parse(savedSongs)
            console.log('📦 [INITIAL LOAD] Fallback: Loaded songs from localStorage:', songs.length, 'songs')
            console.log('📋 [INITIAL LOAD] Fallback: All songs from localStorage:', JSON.stringify(songs, null, 2))
            setSongs(songs)
          } catch (parseError) {
            console.error('❌ [INITIAL LOAD] Error loading songs from localStorage:', parseError)
          }
        } else {
          console.log('📭 [INITIAL LOAD] No songs found in localStorage (fallback)')
        }
      }
    }
    loadSongs()
    
    // Load comments from API
    const loadComments = async () => {
      try {
        const response = await fetch('/api/birthday-poll')
        if (response.ok) {
          const data = await response.json()
          if (data.comments) {
            // Migrate old format to new format if needed
            const migratedComments: Record<string, string[]> = {}
            for (const [name, comment] of Object.entries(data.comments)) {
              if (typeof comment === 'string') {
                migratedComments[name] = comment.trim() ? [comment] : []
              } else if (Array.isArray(comment)) {
                migratedComments[name] = comment.filter((c: string) => c && c.trim())
              }
            }
            setComments(migratedComments)
            localStorage.setItem('birthday-poll-comments', JSON.stringify(migratedComments))
          }
        }
      } catch (error) {
        console.error('Error loading comments from API:', error)
        // Try loading from localStorage as fallback
        const savedComments = localStorage.getItem('birthday-poll-comments')
        if (savedComments) {
          try {
            const commentsData = JSON.parse(savedComments)
            const migratedComments: Record<string, string[]> = {}
            for (const [name, comment] of Object.entries(commentsData)) {
              if (typeof comment === 'string') {
                migratedComments[name] = comment.trim() ? [comment] : []
              } else if (Array.isArray(comment)) {
                migratedComments[name] = comment.filter((c: string) => c && c.trim())
              }
            }
            setComments(migratedComments)
          } catch (error) {
            console.error('Error loading comments from localStorage:', error)
          }
        }
      }
    }

    loadComments()
    
    // Restore original title when component unmounts
    return () => {
      document.title = originalTitle
    }
  }, [])

  // Cleanup long press timer on unmount or game change
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearInterval(longPressTimer)
      }
    }
  }, [longPressTimer])

  // Clear comment input after successful save
  useEffect(() => {
    if (commentSaveSuccess) {
      setTimeout(() => {
        setUserComment('')
      }, 100)
    }
  }, [commentSaveSuccess])

  const fetchSongs = async () => {
    try {
      console.log('🔄 [GAME OPEN] Fetching songs from API...')
      const response = await fetch('/api/birthday-games?gameType=who-picked')
      console.log('📡 [GAME OPEN] Fetch response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('📦 [GAME OPEN] Fetched songs data:', data)
        const songs = data.songs || []
        console.log('✅ [GAME OPEN] Setting songs:', songs.length, 'songs')
        console.log('📋 [GAME OPEN] All songs:', JSON.stringify(songs, null, 2))
        setSongs(songs)
        // Also save to localStorage as backup
        localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(songs))
        return songs
      } else {
        const errorText = await response.text()
        console.error('❌ [GAME OPEN] API fetch failed with status:', response.status, 'Error:', errorText)
      }
      // Fallback to localStorage if API fails
      const savedSongs = localStorage.getItem('birthday-games-who-picked-songs')
      if (savedSongs) {
        try {
          const songs = JSON.parse(savedSongs)
          console.log('📦 [GAME OPEN] Loaded songs from localStorage:', songs.length, 'songs')
          console.log('📋 [GAME OPEN] All songs from localStorage:', JSON.stringify(songs, null, 2))
          setSongs(songs)
          return songs
        } catch (error) {
          console.error('❌ [GAME OPEN] Error loading songs from localStorage:', error)
        }
      } else {
        console.log('📭 [GAME OPEN] No songs found in localStorage')
      }
      return []
    } catch (error) {
      console.error('❌ [GAME OPEN] Error fetching songs:', error)
      // Fallback to localStorage if API fails
      const savedSongs = localStorage.getItem('birthday-games-who-picked-songs')
      if (savedSongs) {
        try {
          const songs = JSON.parse(savedSongs)
          console.log('📦 [GAME OPEN] Fallback: Loaded songs from localStorage:', songs.length, 'songs')
          console.log('📋 [GAME OPEN] Fallback: All songs from localStorage:', JSON.stringify(songs, null, 2))
          setSongs(songs)
          return songs
        } catch (error) {
          console.error('❌ [GAME OPEN] Error loading songs from localStorage:', error)
        }
      } else {
        console.log('📭 [GAME OPEN] No songs found in localStorage (fallback)')
      }
      return []
    }
  }

  const handleGameSelect = async (gameName: string) => {
    if (gameName === "Which One's False") {
      // Fetch submissions first before opening game
      const submissions = await fetchSubmissions()
      // Show list if there are submissions, otherwise show form
      const hasSubmissions = Object.keys(submissions).length > 0
      setShowSubmissionsList(hasSubmissions)
      setCurrentGame(gameName)
    } else if (gameName === "Who Picked") {
      // Fetch songs from API when opening game
      await fetchSongs()
      setCurrentGame(gameName)
    } else if (gameName === "GOAT") {
      // Fetch GOAT submissions first before opening game
      const submissions = await fetchGOATSubmissions()
      // Show list if there are submissions, otherwise show form
      const hasSubmissions = Object.keys(submissions).length > 0
      setShowGOATSubmissionsList(hasSubmissions)
      setCurrentGame(gameName)
    } else {
      console.log(`Selected game: ${gameName} by ${playerName}`)
      // TODO: Implement other game logic
    }
  }

  const handleBackToGames = () => {
    setCurrentGame(null)
    setShowSubmissionsList(false)
    setShowGOATSubmissionsList(false)
    setStatements(['', '', ''])
    setMovies(['', '', ''])
    setExpandedSubmissions(new Set())
    setExpandedGOATSubmissions(new Set())
  }

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/birthday-games')
      if (response.ok) {
        const data = await response.json()
        const submissions = data.submissions || {}
        setSubmittedUsers(submissions)
        return submissions
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    }
    return {}
  }

  const fetchGOATSubmissions = async () => {
    try {
      const response = await fetch('/api/birthday-games?gameType=goat')
      if (response.ok) {
        const data = await response.json()
        const submissions = data.submissions || {}
        setGoatSubmissions(submissions)
        return submissions
      }
    } catch (error) {
      console.error('Error fetching GOAT submissions:', error)
    }
    return {}
  }


  const handleMovieChange = (index: number, value: string) => {
    const sanitized = sanitizeInputForTyping(value, 200) // Max 200 characters per movie
    const newMovies = [...movies]
    newMovies[index] = sanitized
    setMovies(newMovies)
    
    // Clear error for this movie when user starts typing
    if (movieErrors[index]) {
      const newErrors = [...movieErrors]
      newErrors[index] = ''
      setMovieErrors(newErrors)
    }
  }

  const handleMoviesSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: string[] = ['', '', '']
    let hasErrors = false
    
    // Validate all movies are filled
    movies.forEach((movie, index) => {
      if (!movie.trim()) {
        newErrors[index] = 'Please enter a movie'
        hasErrors = true
      }
    })
    
    if (hasErrors) {
      setMovieErrors(newErrors)
      return
    }
    
    if (!playerName) {
      alert('Please enter your name first')
      return
    }
    
    setIsSubmittingGOAT(true)
    
    try {
      const response = await fetch('/api/birthday-games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          movies: movies.map(m => m.trim()),
          gameType: 'goat'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit movies')
      }

      const result = await response.json()
      setGoatSubmissions(result.submissions || {})
      setShowGOATSubmissionsList(true)
      setMovies(['', '', ''])
      setMovieErrors(['', '', ''])
    } catch (error) {
      console.error('Error submitting movies:', error)
      alert('Failed to submit movies. Please try again.')
    } finally {
      setIsSubmittingGOAT(false)
    }
  }

  const handleSongNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInputForTyping(e.target.value, 100)
    setNewSongName(sanitized)
    if (songError) {
      setSongError(null)
    }
  }

  const handleSongArtistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInputForTyping(e.target.value, 100)
    setNewSongArtist(sanitized)
    if (songError) {
      setSongError(null)
    }
  }

  const handleYoutubeSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInputForTyping(e.target.value, 100)
    setYoutubeSearchQuery(sanitized)
    if (youtubeSearchError) {
      setYoutubeSearchError(null)
    }
  }

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const sanitizedSongName = sanitizeInput(newSongName, 100).trim()
    const sanitizedArtist = sanitizeInput(newSongArtist, 100).trim()
    
    if (!sanitizedSongName || !sanitizedArtist) {
      setSongError('Please enter both song name and artist')
      return
    }
    
    // Try to find the song on YouTube
    let videoId: string | undefined = undefined
    try {
      const searchQuery = `${sanitizedSongName} ${sanitizedArtist}`
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.results && result.results.length > 0) {
          // Use the first result as the match
          videoId = result.results[0].videoId
        }
      }
    } catch (error) {
      // Silently fail - if YouTube search doesn't work, just add the song without videoId
      console.log('Could not find song on YouTube, adding without video link')
    }
    
    const newSong = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      songName: sanitizedSongName,
      artist: sanitizedArtist,
      addedBy: playerName,
      addedAt: Date.now(),
      ...(videoId && { videoId })
    }
    
    // Save to API
    try {
      const response = await fetch('/api/birthday-games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName,
          gameType: 'who-picked',
          song: newSong
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.songs) {
          setSongs(result.songs)
          // Also save to localStorage as backup
          localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(result.songs))
        } else {
          // Fallback: update local state if API doesn't return songs
          const updatedSongs = [...songs, newSong]
          setSongs(updatedSongs)
          localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
        }
      } else {
        // Fallback: save to localStorage if API fails
        const updatedSongs = [...songs, newSong]
        setSongs(updatedSongs)
        localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
        console.error('Failed to save song to API, saved locally instead')
      }
    } catch (error) {
      // Fallback: save to localStorage if API fails
      const updatedSongs = [...songs, newSong]
      setSongs(updatedSongs)
      localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
      console.error('Error saving song to API, saved locally instead:', error)
    }
    
    setNewSongName('')
    setNewSongArtist('')
    setSongError(null)
  }

  const handleYoutubeSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!youtubeSearchQuery.trim()) {
      setYoutubeSearchError('Please enter a search query')
      return
    }
    
    setIsSearchingYoutube(true)
    setYoutubeSearchError(null)
    
    try {
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: youtubeSearchQuery,
        }),
      })

      if (!response.ok) {
        // Try to parse error response, but handle cases where response isn't JSON
        let errorMessage = 'Failed to search YouTube'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // If response isn't JSON, use status text
          if (response.status === 404) {
            errorMessage = 'YouTube search API not found. Please restart the dev server or check API configuration.'
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please check if YOUTUBE_API_KEY is configured.'
          } else {
            errorMessage = `Error: ${response.status} ${response.statusText}`
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      setYoutubeResults(result.results || [])
    } catch (error) {
      console.error('Error searching YouTube:', error)
      setYoutubeSearchError(error instanceof Error ? error.message : 'Failed to search YouTube')
      setYoutubeResults([])
    } finally {
      setIsSearchingYoutube(false)
    }
  }

  const parseSongFromYoutubeTitle = (title: string, channelTitle: string): { songName: string; artist: string } => {
    // Try to parse "Song Name - Artist" or "Artist - Song Name" format
    const dashSeparated = title.split(' - ')
    if (dashSeparated.length >= 2) {
      // Try "Song - Artist" first
      const songName = dashSeparated[0].trim()
      const artist = dashSeparated.slice(1).join(' - ').trim()
      // Remove common suffixes like "(Official Video)", "[Official Audio]", etc.
      const cleanSongName = songName.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\[[^\]]*\]\s*$/, '').trim()
      const cleanArtist = artist.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\[[^\]]*\]\s*$/, '').trim()
      return { songName: cleanSongName || title, artist: cleanArtist || channelTitle }
    }
    
    // If no dash, use title as song name and channel as artist
    const cleanTitle = title.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s*\[[^\]]*\]\s*$/, '').trim()
    return { songName: cleanTitle || title, artist: channelTitle }
  }

  const handleSelectYoutubeSong = async (result: { videoId: string; title: string; channelTitle: string; thumbnail: string }) => {
    const { songName, artist } = parseSongFromYoutubeTitle(result.title, result.channelTitle)
    
    // Check if song already exists (by videoId or by name+artist)
    const songExists = songs.some(song => 
      song.videoId === result.videoId || 
      (song.songName.toLowerCase() === songName.toLowerCase() && song.artist.toLowerCase() === artist.toLowerCase())
    )
    
    if (songExists) {
      setYoutubeSearchError('This song is already in the list!')
      return
    }
    
    const newSong = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      songName: songName,
      artist: artist,
      addedBy: playerName,
      addedAt: Date.now(),
      videoId: result.videoId
    }
    
    // Save to API
    try {
      const response = await fetch('/api/birthday-games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName: playerName,
          gameType: 'who-picked',
          song: newSong
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('YouTube song API response:', result)
        if (result.songs && Array.isArray(result.songs)) {
          setSongs(result.songs)
          // Also save to localStorage as backup
          localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(result.songs))
          console.log('Songs updated from API (YouTube):', result.songs.length)
        } else {
          // Fallback: update local state if API doesn't return songs
          console.warn('API response missing songs array (YouTube), using fallback')
          const updatedSongs = [...songs, newSong]
          setSongs(updatedSongs)
          localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
        }
      } else {
        // Fallback: save to localStorage if API fails
        const errorText = await response.text()
        console.error('API failed with status (YouTube):', response.status, 'Error:', errorText)
        const updatedSongs = [...songs, newSong]
        setSongs(updatedSongs)
        localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
        alert('Failed to save song to server. Saved locally, but may not be visible to others.')
      }
    } catch (error) {
      // Fallback: save to localStorage if API fails
      console.error('Error saving song to API (YouTube):', error)
      const updatedSongs = [...songs, newSong]
      setSongs(updatedSongs)
      localStorage.setItem('birthday-games-who-picked-songs', JSON.stringify(updatedSongs))
      alert('Failed to save song to server. Saved locally, but may not be visible to others.')
    }
    
    // Clear search and show success
    setYoutubeSearchQuery('')
    setYoutubeResults([])
    setYoutubeSearchError(null)
    
    // Optional: Show success message briefly
    // You could add a success state here if desired
  }

  const handleLongPressStart = (songId: string) => {
    // Clear any existing timer
    if (longPressTimer) {
      clearInterval(longPressTimer)
    }
    
    setLongPressSongId(songId)
    setLongPressProgress(0)
    
    // Update progress every 100ms
    const progressInterval = setInterval(() => {
      setLongPressProgress((prev) => {
        const newProgress = prev + 2 // 100ms * 50 = 5000ms (5 seconds), so 2% per 100ms
        if (newProgress >= 100) {
          clearInterval(progressInterval)
          // Reveal the song
          setRevealedSongs((prev) => new Set([...prev, songId]))
          setLongPressSongId(null)
          setLongPressProgress(0)
          return 100
        }
        return newProgress
      })
    }, 100)
    
    setLongPressTimer(progressInterval)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearInterval(longPressTimer)
      setLongPressTimer(null)
    }
    setLongPressSongId(null)
    setLongPressProgress(0)
  }

  // Sanitize input without trimming (preserves spaces during typing)
  const sanitizeInputForTyping = (input: string, maxLength: number = 100): string => {
    if (typeof input !== 'string') {
      return ''
    }
    
    return input
      // Remove HTML tags and dangerous characters
      .replace(/[<>\"'&]/g, '')
      // Remove script tags and event handlers (case insensitive)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      // Remove javascript: and data: protocols
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Limit length (don't trim - preserve spaces during typing)
      .slice(0, maxLength)
  }

  const handleStatementChange = (index: number, value: string) => {
    const sanitized = sanitizeInputForTyping(value, 200) // Max 200 characters per statement
    const newStatements = [...statements]
    newStatements[index] = sanitized
    setStatements(newStatements)
    
    // Clear error for this statement when user starts typing
    if (statementErrors[index]) {
      const newErrors = [...statementErrors]
      newErrors[index] = ''
      setStatementErrors(newErrors)
    }
  }

  const handleStatementsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors: string[] = ['', '', '']
    let hasErrors = false
    
    // Validate all statements are filled
    statements.forEach((statement, index) => {
      if (!statement.trim()) {
        newErrors[index] = 'Please enter a statement'
        hasErrors = true
      }
    })
    
    if (hasErrors) {
      setStatementErrors(newErrors)
      return
    }
    
    if (!playerName) {
      alert('Please enter your name first')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/birthday-games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerName,
          statements,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit statements')
      }

      const result = await response.json()
      const submissions = result.submissions || {}
      setSubmittedUsers(submissions)
      setShowSubmissionsList(true)
      setStatements(['', '', ''])
      setStatementErrors(['', '', ''])
    } catch (error) {
      console.error('Error submitting statements:', error)
      alert('Failed to submit statements. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const sanitizedName = sanitizeInput(playerNameInput, 50) // Max 50 characters for player name
    
    if (!sanitizedName || sanitizedName.trim() === '') {
      setNameError('Please enter your name')
      return
    }
    
    const trimmedName = sanitizedName.trim()
    setPlayerName(trimmedName)
    localStorage.setItem('birthday-games-player-name', trimmedName)
    setPlayerNameInput('')
    setNameError(null)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const sanitized = sanitizeInput(rawValue, 50)
    setPlayerNameInput(sanitized)
    if (nameError) {
      setNameError(null)
    }
  }

  const handleChangeName = () => {
    setPlayerName('')
    setPlayerNameInput('')
    localStorage.removeItem('birthday-games-player-name')
  }

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    // Limit to 500 characters
    if (value.length <= 500) {
      setUserComment(value)
    }
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!playerName || !playerName.trim()) {
      alert('Please enter your name first')
      return
    }

    // Validate comment
    if (!userComment || !userComment.trim()) {
      alert('Please enter a comment')
      return
    }

    setIsSavingComment(true)
    
    try {
      const response = await fetch('/api/birthday-poll', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: playerName.trim(),
          comment: userComment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save comment')
      }

      const result = await response.json()
      
      // Update comments state
      if (result.comments) {
        // Migrate old format to new format if needed
        const migratedComments: Record<string, string[]> = {}
        for (const [name, comment] of Object.entries(result.comments)) {
          if (typeof comment === 'string') {
            migratedComments[name] = comment.trim() ? [comment] : []
          } else if (Array.isArray(comment)) {
            migratedComments[name] = comment.filter((c: string) => c && c.trim())
          }
        }
        setComments(migratedComments)
        localStorage.setItem('birthday-poll-comments', JSON.stringify(migratedComments))
      }
      
      // Clear input and show success message
      setUserComment('')
      setCommentSaveSuccess(true)
      setTimeout(() => {
        setCommentSaveSuccess(false)
      }, 3000) // Hide after 3 seconds
    } catch (error) {
      console.error('Error saving comment:', error)
      alert('Failed to save comment. Please try again.')
    } finally {
      setIsSavingComment(false)
    }
  }

  return (
    <Layout>
      <div className="page-container">
        <div className={`birthday-games ${isContentExploding ? 'content-exploding' : ''}`}>
          <h1 
            className={`page-title birthday-games-title-toggle ${isContentExploding ? 'exploding' : ''}`}
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleTheme()
              }
            }}
            aria-label="Toggle light/dark mode"
            title="Click to toggle light/dark mode"
          >
            Birthday Games
          </h1>
          
          {!playerName ? (
            <div className={`player-name-section ${isContentExploding ? 'exploding' : ''}`}>
              <p className={`games-subtitle ${isContentExploding ? 'exploding' : ''}`}>
                Enter your name to start playing!
              </p>
              <form onSubmit={handleNameSubmit} className="player-name-form">
                <div className="player-name-field">
                  <input
                    type="text"
                    value={playerNameInput}
                    onChange={handleNameChange}
                    placeholder="Your name"
                    className={`player-name-input ${nameError ? 'error' : ''}`}
                    autoFocus
                    required
                    maxLength={50}
                    aria-label="Your name"
                    aria-invalid={nameError ? 'true' : 'false'}
                    aria-describedby={nameError ? 'name-error' : undefined}
                  />
                  {nameError && (
                    <p id="name-error" className="player-name-error" role="alert">
                      {nameError}
                    </p>
                  )}
                </div>
                <button type="submit" className="player-name-submit">
                  Start Playing
                </button>
              </form>
            </div>
          ) : !currentGame ? (
            <>
              <p className={`games-subtitle ${isContentExploding ? 'exploding' : ''}`}>
                It's my Birthday games, {playerName}! Choose a game to play!
              </p>
              <button
                onClick={handleChangeName}
                className="change-name-button"
                aria-label="Change player name"
              >
                Change Name
              </button>
              
              <div className={`games-container ${isContentExploding ? 'exploding' : ''}`}>
                <div className="games-grid">
                  <button
                    className="game-card"
                    onClick={() => handleGameSelect('Which One\'s False')}
                    aria-label="Play Which One's False game"
                  >
                    <div className="game-card-content">
                      <h2 className="game-card-title">Which One's False</h2>
                      <p className="game-card-description">
                        Share three statements about yourself and let others guess which one is false!
                      </p>
                    </div>
                  </button>

                  <button
                    className="game-card"
                    onClick={() => handleGameSelect('Who Picked')}
                    aria-label="Play Who Picked game"
                  >
                    <div className="game-card-content">
                      <h2 className="game-card-title">Who Picked</h2>
                      <p className="game-card-description">
                        Guess which person picked added a song to the list!
                      </p>
                    </div>
                  </button>

                  <button
                    className="game-card"
                    onClick={() => handleGameSelect('GOAT')}
                    aria-label="Play GOAT game"
                  >
                    <div className="game-card-content">
                      <h2 className="game-card-title">GOAT</h2>
                      <p className="game-card-description">
                        Share your top 3 movies of all time! IMDB is there to help!.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* All Comments Section - Show all comments from all users */}
              <div className={`all-comments-section ${isContentExploding ? 'exploding' : ''}`}>
                <div 
                  className={`all-comments-header ${isCommentsCollapsed ? 'collapsed' : ''}`}
                  onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setIsCommentsCollapsed(!isCommentsCollapsed)
                    }
                  }}
                  aria-expanded={!isCommentsCollapsed}
                  aria-label={`${isCommentsCollapsed ? 'Expand' : 'Collapse'} messages from everyone`}
                >
                <h3 className={`all-comments-title ${isContentExploding ? 'exploding' : ''}`}>
                  Messages from Everyone ({Object.values(comments).flat().length})
                </h3>
                  <span className="all-comments-toggle-icon" aria-hidden="true">
                    {isCommentsCollapsed ? '▶' : '▼'}
                  </span>
                </div>
                {!isCommentsCollapsed && (
                  <div className="all-comments-content">
                {Object.values(comments).flat().length > 0 ? (
                  <div className="all-comments-list">
                    {Object.entries(comments)
                      .flatMap(([name, commentArray]) => 
                        commentArray.map((comment, index) => ({ name, comment, index }))
                      )
                      .map(({ name, comment, index }) => (
                        <div key={`${name}-${index}`} className={`comment-item ${name === playerName ? 'current-user-comment' : ''}`}>
                          <div className="comment-item-header">
                            <span className="comment-author">{name}</span>
                            {name === playerName && (
                              <span className="comment-badge">You</span>
                            )}
                          </div>
                          <div className="comment-item-text">{comment}</div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="no-comments-message">
                    <p>No messages yet. Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Comment Section - Available to everyone with a name */}
              <div className={`comment-section ${isContentExploding ? 'exploding' : ''}`}>
                <h3 className={`comment-section-title ${isContentExploding ? 'exploding' : ''}`}>
                  Add a Comment
                </h3>
                <p className={`comment-section-description ${isContentExploding ? 'exploding' : ''}`}>
                  Got a thought or feeling you want to share?
                </p>
                
                {/* Success message */}
                {commentSaveSuccess && (
                  <div className="comment-success-message">
                    ✓ Comment saved successfully!
                  </div>
                )}
                
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <textarea
                    value={userComment}
                    onChange={handleCommentChange}
                    placeholder="Your comment here..."
                    className="comment-textarea"
                    rows={4}
                    maxLength={500}
                    aria-label="Comment"
                  />
                  <div className="comment-footer">
                    <span className="comment-character-count">
                      {userComment.length}/500 characters
                    </span>
                    <button
                      type="submit"
                      className="comment-submit-button"
                      disabled={isSavingComment || !userComment.trim()}
                    >
                      {isSavingComment ? 'Saving...' : 'Add Comment'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Scan to Share Button */}
              {qrUrl && (
                <div className="scan-to-share-section">
                  <button
                    className="scan-to-share-button"
                    onClick={() => setIsQrCollapsed(!isQrCollapsed)}
                    aria-label={isQrCollapsed ? 'Show QR code' : 'Hide QR code'}
                    aria-expanded={!isQrCollapsed}
                  >
                    {isQrCollapsed ? '▶ Scan to Share' : '▼ Scan to Share'}
                  </button>
                  {!isQrCollapsed && (
                    <div className="scan-to-share-content">
                      <div className="scan-to-share-qr-container">
                        <QRCodeSVG
                          value={qrUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                          fgColor="#000000"
                          bgColor="#ffffff"
                        />
                      </div>
                      <p className="scan-to-share-url">{qrUrl}</p>
                    </div>
          )}
                </div>
              )}

              {/* Back to Invite Button */}
              <div className="back-to-invite-section">
                <button
                  className="back-to-invite-button"
                  onClick={() => navigate('/jda11202025')}
                  aria-label="Back to birthday invite"
                >
                  ← Back to Invite
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Which One's False Game View */}
      {currentGame === "Which One's False" && (
        <div className="game-full-page">
          <div className="game-full-page-header">
              <button
              className="game-back-button"
              onClick={handleBackToGames}
              aria-label="Back to games"
              >
              ← Back to Games
              </button>
            <h2 className="game-full-page-title">Which One's False</h2>
            </div>
          <div className="game-full-page-content">
              {!showSubmissionsList ? (
                <>
                  <p className="game-modal-description">
                    Enter three statements about yourself. Two should be true, and one should be false. 
                    Others will try to guess which one is false!
                  </p>
                  <form onSubmit={handleStatementsSubmit} className="statements-form">
                {statements.map((statement, index) => (
                  <div key={index} className="statement-field">
                    <label htmlFor={`statement-${index}`} className="statement-label">
                      Statement {index + 1}
                    </label>
                    <textarea
                      id={`statement-${index}`}
                      value={statement}
                      onChange={(e) => handleStatementChange(index, e.target.value)}
                      placeholder={`Enter statement ${index + 1}...`}
                      className={`statement-input ${statementErrors[index] ? 'error' : ''}`}
                      rows={3}
                      maxLength={200}
                      aria-label={`Statement ${index + 1}`}
                      aria-invalid={statementErrors[index] ? 'true' : 'false'}
                      aria-describedby={statementErrors[index] ? `statement-error-${index}` : undefined}
                    />
                    {statementErrors[index] && (
                      <p id={`statement-error-${index}`} className="statement-error" role="alert">
                        {statementErrors[index]}
                      </p>
                    )}
                    <span className="statement-character-count">
                      {statement.length}/200 characters
                    </span>
                  </div>
                ))}
                <div className="game-modal-actions">
                  <button
                    type="button"
                    className="game-modal-cancel"
                    onClick={handleBackToGames}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="game-modal-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Statements'}
                  </button>
                </div>
              </form>
                </>
              ) : (
                <div className="submissions-list">
                  {Object.keys(submittedUsers).length === 0 ? (
                    <div className="no-submissions-message">
                      <h3 className="no-submissions-title">Add First Answer!</h3>
                      <p className="no-submissions-description">
                        Be the first to submit your statements!
                      </p>
                      <button
                        type="button"
                        className="game-modal-submit"
                        onClick={() => setShowSubmissionsList(false)}
                      >
                        Add Your Answer
                      </button>
                      <button
                        type="button"
                        className="game-modal-cancel"
                        onClick={handleBackToGames}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                  <div className="submissions-list-header">
                    <div>
                      <h3 className="submissions-list-title">Submitted Players</h3>
                      <p className="submissions-list-description">
                        {Object.keys(submittedUsers).length} player{Object.keys(submittedUsers).length !== 1 ? 's' : ''} have submitted their statements!
                      </p>
                    </div>
                    {!showPlayerNames && (
                      <button
                        type="button"
                        className="reveal-names-button"
                        onClick={() => setShowRevealConfirmation(true)}
                      >
                        Reveal Names
                      </button>
                    )}
                  </div>
                  <div className="submissions-list-items">
                    {Object.entries(submittedUsers)
                      .sort(([, a], [, b]) => b.submittedAt - a.submittedAt)
                      .map(([key, submission], index) => {
                        const isExpanded = expandedSubmissions.has(key)
                        return (
                          <div key={key} className={`submission-item ${isExpanded ? 'expanded' : ''}`}>
                            <div 
                              className="submission-header"
                              onClick={() => {
                                const newExpanded = new Set(expandedSubmissions)
                                if (isExpanded) {
                                  newExpanded.delete(key)
                                } else {
                                  newExpanded.add(key)
                                }
                                setExpandedSubmissions(newExpanded)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <h4 className="submission-player-name">
                                {showPlayerNames ? submission.playerName : `Player ${index + 1}`}
                              </h4>
                              <span className="submission-toggle-icon">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="submission-statements">
                                {submission.statements.map((statement, statementIndex) => (
                                  <div key={statementIndex} className="submission-statement">
                                    <span className="submission-statement-number">{statementIndex + 1}.</span>
                                    <span className="submission-statement-text">{statement}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                  {showPlayerNames && (
                    <div className="players-summary">
                      <h4 className="players-summary-title">Players:</h4>
                      <div className="players-summary-list">
                        {Object.entries(submittedUsers)
                          .sort(([, a], [, b]) => b.submittedAt - a.submittedAt)
                          .map(([key, submission], index) => (
                            <span key={key} className="player-summary-item">
                              {submission.playerName}
                              {index < Object.keys(submittedUsers).length - 1 && ','}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="submissions-list-actions">
                    <button
                      type="button"
                      className="game-modal-submit"
                      onClick={() => {
                        setShowSubmissionsList(false)
                        setStatements(['', '', ''])
                      }}
                    >
                      Add Another Entry
                    </button>
                    <button
                      type="button"
                      className="game-modal-cancel"
                        onClick={handleBackToGames}
                    >
                      Close
                    </button>
                  </div>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* Who Picked Game View */}
      {currentGame === "Who Picked" && (
        <div className="game-full-page">
          <div className="game-full-page-header">
              <button
              className="game-back-button"
              onClick={handleBackToGames}
              aria-label="Back to games"
              >
              ← Back to Games
              </button>
            <h2 className="game-full-page-title">Who Picked</h2>
            </div>
          <div className="game-full-page-content">
              <p className="game-modal-description">
                Add songs to the list! Others will try to guess who picked each song.
              </p>
              
              {/* YouTube Search Section */}
              <div className="youtube-search-section">
                <h3 className="youtube-search-title">Search on YouTube</h3>
                <form onSubmit={handleYoutubeSearch} className="youtube-search-form">
                  <div className="youtube-search-field">
                    <input
                      type="text"
                      value={youtubeSearchQuery}
                      onChange={handleYoutubeSearchQueryChange}
                      placeholder="Search for a song on YouTube..."
                      className="youtube-search-input"
                      maxLength={100}
                      aria-label="YouTube search"
                    />
                    <button
                      type="submit"
                      className="youtube-search-button"
                      disabled={isSearchingYoutube || !youtubeSearchQuery.trim()}
                    >
                      {isSearchingYoutube ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                  {youtubeSearchError && (
                    <p className="youtube-search-error" role="alert">
                      {youtubeSearchError}
                    </p>
                  )}
                </form>
                
                {/* YouTube Results */}
                {youtubeResults.length > 0 && (
                  <div className="youtube-results">
                    <h4 className="youtube-results-title">Search Results</h4>
                    <div className="youtube-results-list">
                      {youtubeResults.map((result) => (
                        <button
                          key={result.videoId}
                          type="button"
                          className="youtube-result-item"
                          onClick={() => handleSelectYoutubeSong(result)}
                        >
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="youtube-result-thumbnail"
                          />
                          <div className="youtube-result-info">
                            <div className="youtube-result-title">{result.title}</div>
                            <div className="youtube-result-channel">{result.channelTitle}</div>
                          </div>
                          <div className="youtube-result-add">+ Add</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Add Song Form */}
              <form onSubmit={handleAddSong} className="add-song-form">
                <div className="song-form-fields">
                  <div className="song-field">
                    <label htmlFor="song-name" className="song-label">
                      Song Name
                    </label>
                    <input
                      id="song-name"
                      type="text"
                      value={newSongName}
                      onChange={handleSongNameChange}
                      placeholder="Enter song name..."
                      className={`song-input ${songError ? 'error' : ''}`}
                      maxLength={100}
                      aria-label="Song name"
                      aria-invalid={songError ? 'true' : 'false'}
                    />
                  </div>
                  <div className="song-field">
                    <label htmlFor="song-artist" className="song-label">
                      Artist
                    </label>
                    <input
                      id="song-artist"
                      type="text"
                      value={newSongArtist}
                      onChange={handleSongArtistChange}
                      placeholder="Enter artist name..."
                      className={`song-input ${songError ? 'error' : ''}`}
                      maxLength={100}
                      aria-label="Artist name"
                      aria-invalid={songError ? 'true' : 'false'}
                    />
                  </div>
                </div>
                {songError && (
                  <p className="song-error" role="alert">
                    {songError}
                  </p>
                )}
                <button type="submit" className="game-modal-submit add-song-button">
                  Add Song
                </button>
              </form>

              {/* Songs List */}
              <div className="songs-list-section">
                <h3 className="songs-list-title">
                  Songs ({songs.length})
                </h3>
                {songs.length === 0 ? (
                  <p className="no-songs-message">No songs added yet. Be the first to add one!</p>
                ) : (
                  <div className="songs-list">
                    {songs.map((song) => {
                      const isLongPressing = longPressSongId === song.id
                      const isRevealed = revealedSongs.has(song.id)
                      
                      return (
                        <div 
                          key={song.id} 
                          className={`song-item ${isLongPressing ? 'long-pressing' : ''} ${isRevealed ? 'revealed' : ''}`}
                          onMouseDown={() => handleLongPressStart(song.id)}
                          onMouseUp={handleLongPressEnd}
                          onMouseLeave={handleLongPressEnd}
                          onTouchStart={() => handleLongPressStart(song.id)}
                          onTouchEnd={handleLongPressEnd}
                          onTouchCancel={handleLongPressEnd}
                        >
                          {isLongPressing && (
                            <div className="long-press-progress">
                              <div 
                                className="long-press-progress-bar" 
                                style={{ width: `${longPressProgress}%` }}
                              />
                              <span className="long-press-progress-text">
                                {Math.round(longPressProgress / 20)}s
                              </span>
                            </div>
                          )}
                        <div className="song-info">
                          <div className="song-name">{song.songName}</div>
                          <div className="song-artist">by {song.artist}</div>
                            {isRevealed && (
                              <div className="song-added-by">
                                Added by: {song.addedBy}
                              </div>
                            )}
                        </div>
                        {song.videoId && (
                          <a
                            href={`https://www.youtube.com/watch?v=${song.videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="song-youtube-link"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open ${song.songName} on YouTube`}
                          >
                            <span className="youtube-icon">▶</span>
                            Watch on YouTube
                          </a>
                        )}
                      </div>
                      )
                    })}
                  </div>
                )}
              </div>

          </div>
        </div>
      )}

      {/* GOAT Game View */}
      {currentGame === "GOAT" && (
        <div className="game-full-page">
          <div className="game-full-page-header">
              <button
              className="game-back-button"
              onClick={handleBackToGames}
              aria-label="Back to games"
              >
              ← Back to Games
              </button>
            <h2 className="game-full-page-title">GOAT</h2>
            </div>
          <div className="game-full-page-content">
              {!showGOATSubmissionsList ? (
                <>
                  <p className="game-modal-description">
                    Enter your top 3 movies of all time! Use <a href="https://www.imdb.com/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>IMDB</a> to find your favorites.
                    Others will see your choices anonymously.
                  </p>
                  <form onSubmit={handleMoviesSubmit} className="statements-form">
                    {movies.map((movie, index) => (
                      <div key={index} className="statement-field">
                        <label htmlFor={`movie-${index}`} className="statement-label">
                          Movie {index + 1}
                        </label>
                        <textarea
                          id={`movie-${index}`}
                          value={movie}
                          onChange={(e) => handleMovieChange(index, e.target.value)}
                          placeholder={`Enter movie ${index + 1}...`}
                          className={`statement-input ${movieErrors[index] ? 'error' : ''}`}
                          rows={3}
                          maxLength={200}
                          aria-label={`Movie ${index + 1}`}
                          aria-invalid={movieErrors[index] ? 'true' : 'false'}
                          aria-describedby={movieErrors[index] ? `movie-error-${index}` : undefined}
                        />
                        {movieErrors[index] && (
                          <p id={`movie-error-${index}`} className="statement-error" role="alert">
                            {movieErrors[index]}
                          </p>
                        )}
                        <span className="statement-character-count">
                          {movie.length}/200 characters
                        </span>
                      </div>
                    ))}
                    <div className="game-modal-actions">
                      <button
                        type="button"
                        className="game-modal-cancel"
                        onClick={handleBackToGames}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="game-modal-submit"
                        disabled={isSubmittingGOAT}
                      >
                        {isSubmittingGOAT ? 'Submitting...' : 'Submit Movies'}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="submissions-list">
                  {Object.keys(goatSubmissions).length === 0 ? (
                    <div className="no-submissions-message">
                      <h3 className="no-submissions-title">Add First Answer!</h3>
                      <p className="no-submissions-description">
                        Be the first to submit your top 3 movies!
                      </p>
                      <button
                        type="button"
                        className="game-modal-submit"
                        onClick={() => setShowGOATSubmissionsList(false)}
                      >
                        Add Your Answer
                      </button>
                      <button
                        type="button"
                        className="game-modal-cancel"
                        onClick={handleBackToGames}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                  <div className="submissions-list-header">
                    <div>
                      <h3 className="submissions-list-title">Submitted Players</h3>
                      <p className="submissions-list-description">
                        {Object.keys(goatSubmissions).length} player{Object.keys(goatSubmissions).length !== 1 ? 's' : ''} have submitted their movies!
                      </p>
                    </div>
                    {!showGOATPlayerNames && (
                      <button
                        type="button"
                        className="reveal-names-button"
                        onClick={() => setShowGOATRevealConfirmation(true)}
                      >
                        Reveal Names
                      </button>
                    )}
                  </div>
                  <div className="submissions-list-items">
                    {Object.entries(goatSubmissions)
                      .sort(([, a], [, b]) => b.submittedAt - a.submittedAt)
                      .map(([key, submission], index) => {
                        const isExpanded = expandedGOATSubmissions.has(key)
                        return (
                          <div key={key} className={`submission-item ${isExpanded ? 'expanded' : ''}`}>
                            <div 
                              className="submission-header"
                              onClick={() => {
                                const newExpanded = new Set(expandedGOATSubmissions)
                                if (isExpanded) {
                                  newExpanded.delete(key)
                                } else {
                                  newExpanded.add(key)
                                }
                                setExpandedGOATSubmissions(newExpanded)
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              <h4 className="submission-player-name">
                                {showGOATPlayerNames ? submission.playerName : `Player ${index + 1}`}
                              </h4>
                              <span className="submission-toggle-icon">
                                {isExpanded ? '▼' : '▶'}
                              </span>
                            </div>
                            {isExpanded && (
                              <div className="submission-statements">
                                {submission.movies.map((movie, movieIndex) => (
                                  <div key={movieIndex} className="submission-statement">
                                    <span className="submission-statement-number">{movieIndex + 1}.</span>
                                    <span className="submission-statement-text">{movie}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                  {showGOATPlayerNames && (
                    <div className="players-summary">
                      <h4 className="players-summary-title">Players:</h4>
                      <div className="players-summary-list">
                        {Object.entries(goatSubmissions)
                          .sort(([, a], [, b]) => b.submittedAt - a.submittedAt)
                          .map(([key, submission], index) => (
                            <span key={key} className="player-summary-item">
                              {submission.playerName}
                              {index < Object.keys(goatSubmissions).length - 1 && ','}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="submissions-list-actions">
                    <button
                      type="button"
                      className="game-modal-submit"
                      onClick={() => {
                        setShowGOATSubmissionsList(false)
                        setMovies(['', '', ''])
                      }}
                    >
                      Add Another Entry
                    </button>
                    <button
                      type="button"
                      className="game-modal-cancel"
                          onClick={handleBackToGames}
                    >
                      Close
                    </button>
                  </div>
                    </>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {/* GOAT Reveal Names Confirmation Modal */}
      {showGOATRevealConfirmation && (
        <div className="game-modal-overlay" onClick={() => setShowGOATRevealConfirmation(false)}>
          <div className="game-modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h2 className="game-modal-title">Are You Sure?</h2>
              <button
                className="game-modal-close"
                onClick={() => setShowGOATRevealConfirmation(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="game-modal-content">
              <p className="game-modal-description">
                Once you reveal the names, they cannot be hidden again. Are you sure you want to proceed?
              </p>
              <div className="game-modal-actions">
                <button
                  type="button"
                  className="game-modal-cancel"
                  onClick={() => setShowGOATRevealConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="game-modal-submit"
                  onClick={() => {
                    setShowGOATPlayerNames(true)
                    setShowGOATRevealConfirmation(false)
                  }}
                >
                  Yes, Reveal Names
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reveal Names Confirmation Modal */}
      {showRevealConfirmation && (
        <div className="game-modal-overlay" onClick={() => setShowRevealConfirmation(false)}>
          <div className="game-modal confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="game-modal-header">
              <h2 className="game-modal-title">Are You Sure?</h2>
              <button
                className="game-modal-close"
                onClick={() => setShowRevealConfirmation(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="game-modal-content">
              <p className="game-modal-description">
                Revealing player names will show who submitted each set of statements. This cannot be undone.
              </p>
              <div className="confirmation-modal-actions">
                <button
                  type="button"
                  className="game-modal-cancel"
                  onClick={() => setShowRevealConfirmation(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="game-modal-submit"
                  onClick={() => {
                    setShowPlayerNames(true)
                    setShowRevealConfirmation(false)
                  }}
                >
                  Yes, Reveal Names
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  )
}

export default BirthdayGames

