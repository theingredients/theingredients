import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { sanitizePhoneNumber, isValidPhoneNumber } from '../utils/inputSanitizer'
import './Contact.css'

const ContactMe = () => {
  const navigate = useNavigate()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [micEnabled, setMicEnabled] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const visualizationTimeoutRef = useRef<number | null>(null)

  // Lock orientation to portrait when component mounts
  useEffect(() => {
    // Lock orientation to portrait if Screen Orientation API is available
    if ('orientation' in screen && screen.orientation) {
      const orientation = screen.orientation as any
      if (typeof orientation.lock === 'function') {
        orientation.lock('portrait').catch((err: unknown) => {
          // Orientation lock may fail in some browsers or contexts
          console.log('Orientation lock not supported or failed:', err)
        })
      }
    }
    
    return () => {
      // Unlock orientation when component unmounts
      if ('orientation' in screen && screen.orientation) {
        const orientation = screen.orientation as any
        if (typeof orientation.unlock === 'function') {
          try {
            orientation.unlock()
          } catch {
            // Ignore unlock errors
          }
        }
      }
    }
  }, [])

  // Stop visualization function
  const stopVisualization = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Cleanup function to ensure all resources are properly released
  const cleanupAudioResources = useCallback(() => {
    // Stop visualization
    stopVisualization()
    
    // Clear any pending visualization timeout
    if (visualizationTimeoutRef.current) {
      clearTimeout(visualizationTimeoutRef.current)
      visualizationTimeoutRef.current = null
    }
    
    // Disconnect media stream source if it exists
    if (mediaStreamSourceRef.current) {
      try {
        mediaStreamSourceRef.current.disconnect()
      } catch (error) {
        // Ignore errors if already disconnected
        console.debug('MediaStreamSource already disconnected:', error)
      }
      mediaStreamSourceRef.current = null
    }
    
    // Stop microphone tracks if active
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => {
        track.stop()
        track.enabled = false
      })
      micStreamRef.current = null
    }
    
    // Reset mic enabled state
    setMicEnabled(false)
    
    // Clean up audio context when component unmounts
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch((error) => {
        console.debug('Error closing audio context:', error)
      })
      audioContextRef.current = null
    }
    analyserRef.current = null
  }, [stopVisualization])

  // Initialize Audio Context, analyser when component mounts
  useEffect(() => {
    // Initialize audio context (but don't resume yet - mobile requires user interaction)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Create analyser node for visualization
    if (!analyserRef.current && audioContextRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 2048
      analyserRef.current.smoothingTimeConstant = 0.8
    }
    
    // Start visualization after a short delay to ensure canvas is rendered
    visualizationTimeoutRef.current = window.setTimeout(() => {
      startVisualization()
      visualizationTimeoutRef.current = null
    }, 100)

    return () => {
      cleanupAudioResources()
    }
  }, [cleanupAudioResources])

  // Function to ensure audio context is resumed (required for mobile)
  const ensureAudioContextResumed = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
      } catch (error) {
        console.warn('Could not resume audio context:', error)
      }
    }
  }

  // Handle page visibility changes (tab switching, minimizing window)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - clean up microphone to save resources
        if (micEnabled && micStreamRef.current) {
          // Stop microphone when page becomes hidden
          if (micStreamRef.current) {
            micStreamRef.current.getTracks().forEach(track => track.stop())
            micStreamRef.current = null
          }
          if (mediaStreamSourceRef.current) {
            try {
              mediaStreamSourceRef.current.disconnect()
            } catch (error) {
              console.debug('Error disconnecting MediaStreamSource:', error)
            }
            mediaStreamSourceRef.current = null
          }
          setMicEnabled(false)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [micEnabled])

  // Handle beforeunload (browser close/refresh)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clean up microphone before page unloads
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (mediaStreamSourceRef.current) {
        try {
          mediaStreamSourceRef.current.disconnect()
        } catch (error) {
          // Ignore errors during unload
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size with high DPI support
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    // Set actual display size
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    const analyser = analyserRef.current
    analyser.fftSize = 256 // Good balance for visualizer
    analyser.smoothingTimeConstant = 0.8 // Smooth animations
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    
    // Store previous values for smooth transitions
    const previousValues = new Array(bufferLength).fill(0)
    
    // Animation state
    let animationTime = 0

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)

      // Get frequency domain data
      analyser.getByteFrequencyData(dataArray)

      const width = rect.width
      const height = rect.height
      animationTime += 0.02

      // Check if dark mode is active
      const isDarkMode = document.body.classList.contains('theme-dark')

      // Clear canvas with gradient background (adapts to theme)
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      if (isDarkMode) {
        gradient.addColorStop(0, 'rgba(10, 10, 30, 0.95)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
      } else {
        gradient.addColorStop(0, 'rgba(250, 250, 255, 0.95)')
        gradient.addColorStop(1, 'rgba(240, 240, 250, 0.95)')
      }
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Calculate bar properties
      const barCount = 64 // Number of bars to display
      const barWidth = width / barCount
      const barSpacing = barWidth * 0.1

      // Draw animated frequency bars
      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency bin
        const binIndex = Math.floor((i / barCount) * bufferLength)
        const value = dataArray[binIndex]
        const normalizedValue = value / 255
        
        // Smooth the value with previous value
        previousValues[i] = Math.max(previousValues[i] * 0.7, normalizedValue)
        const smoothedValue = previousValues[i]
        
        // Calculate bar height with bounce effect
        const barHeight = smoothedValue * height * 0.9
        
        // Calculate position
        const x = i * barWidth + barSpacing
        
        // Create gradient for each bar
        const barGradient = ctx.createLinearGradient(x, height, x, height - barHeight)
        
        // Color based on frequency and amplitude
        const hue = (i / barCount) * 360 + (animationTime * 20) % 360
        const saturation = 80 + (smoothedValue * 20)
        const lightness = 50 + (smoothedValue * 30)
        
        barGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
        barGradient.addColorStop(0.5, `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness + 10}%)`)
        barGradient.addColorStop(1, `hsl(${(hue + 60) % 360}, ${saturation}%, ${lightness + 20}%)`)
        
        ctx.fillStyle = barGradient
        
        // Draw rounded bar
        const radius = barWidth * 0.2
        const actualBarWidth = barWidth - barSpacing * 2
        const barY = height - barHeight
        
        ctx.beginPath()
        // Draw rounded rectangle manually for compatibility
        ctx.moveTo(x + radius, barY)
        ctx.lineTo(x + actualBarWidth - radius, barY)
        ctx.quadraticCurveTo(x + actualBarWidth, barY, x + actualBarWidth, barY + radius)
        ctx.lineTo(x + actualBarWidth, height)
        ctx.lineTo(x, height)
        ctx.lineTo(x, barY + radius)
        ctx.quadraticCurveTo(x, barY, x + radius, barY)
        ctx.closePath()
        ctx.fill()
        
        // Add glow effect for active bars
        if (smoothedValue > 0.3) {
          ctx.shadowBlur = 15
          ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }

      // Draw center waveform line (optional overlay) - adapts to theme
      ctx.strokeStyle = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'
      ctx.lineWidth = 1
      ctx.beginPath()
      
      const sliceWidth = width / bufferLength
      let waveformX = 0
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255
        const y = height - (v * height)
        
        if (i === 0) {
          ctx.moveTo(waveformX, y)
        } else {
          ctx.lineTo(waveformX, y)
        }
        
        waveformX += sliceWidth
      }
      
      ctx.stroke()

      // Draw particles/sparkles for high energy frequencies - adapts to theme
      ctx.fillStyle = isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)'
      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor((i / barCount) * bufferLength)
        const value = dataArray[binIndex] / 255
        
        if (value > 0.7) {
          const x = i * barWidth + barWidth / 2
          const y = height - (value * height * 0.9) - 10
          
          // Draw sparkle
          ctx.beginPath()
          ctx.arc(x, y, 2 + Math.random() * 2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    draw()
  }

  const handleMicToggle = async () => {
    if (micEnabled) {
      // Disable microphone
      if (mediaStreamSourceRef.current) {
        try {
          mediaStreamSourceRef.current.disconnect()
        } catch (error) {
          console.debug('Error disconnecting MediaStreamSource:', error)
        }
        mediaStreamSourceRef.current = null
      }
      
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => {
          track.stop()
          track.enabled = false
        })
        micStreamRef.current = null
      }
      setMicEnabled(false)
    } else {
      // Enable microphone - ensure audio context is resumed first (critical for mobile)
      await ensureAudioContextResumed()
      
      // Enable microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
        setMicEnabled(true)

        // Connect microphone to analyser
        if (audioContextRef.current && analyserRef.current) {
          // Disconnect any existing source first
          if (mediaStreamSourceRef.current) {
            try {
              mediaStreamSourceRef.current.disconnect()
            } catch (error) {
              console.debug('Error disconnecting existing MediaStreamSource:', error)
            }
          }
          
          // Create and store the new media stream source
          const source = audioContextRef.current.createMediaStreamSource(stream)
          source.connect(analyserRef.current)
          mediaStreamSourceRef.current = source
          
          // Resume audio context if suspended (required by some browsers, especially mobile)
          if (audioContextRef.current.state === 'suspended') {
            try {
              await audioContextRef.current.resume()
            } catch (error) {
              console.warn('Could not resume audio context for microphone:', error)
            }
          }
        }
      } catch (error) {
        console.warn('Microphone access denied:', error)
        setMicEnabled(false)
        // Clean up any partial state
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach(track => track.stop())
          micStreamRef.current = null
        }
      }
    }
  }

  // DTMF frequency mapping (Dual-Tone Multi-Frequency)
  // Standard DTMF specification per ITU-T Recommendation Q.23
  // Low frequencies (rows): 697, 770, 852, 941 Hz
  // High frequencies (columns): 1209, 1336, 1477 Hz
  // Each key combines one low + one high frequency
  // Reference: https://www.onsip.com/voip-resources/voip-fundamentals/dtmf-tones-and-signaling-explained
  const dtmfFrequencies: { [key: string]: [number, number] } = {
    // Row 1 (697 Hz): 1, 2, 3
    '1': [697, 1209],  // 697 Hz (row) + 1209 Hz (col 1)
    '2': [697, 1336],  // 697 Hz (row) + 1336 Hz (col 2)
    '3': [697, 1477],  // 697 Hz (row) + 1477 Hz (col 3)
    // Row 2 (770 Hz): 4, 5, 6
    '4': [770, 1209],  // 770 Hz (row) + 1209 Hz (col 1)
    '5': [770, 1336],  // 770 Hz (row) + 1336 Hz (col 2)
    '6': [770, 1477],  // 770 Hz (row) + 1477 Hz (col 3)
    // Row 3 (852 Hz): 7, 8, 9
    '7': [852, 1209],  // 852 Hz (row) + 1209 Hz (col 1)
    '8': [852, 1336],  // 852 Hz (row) + 1336 Hz (col 2)
    '9': [852, 1477],  // 852 Hz (row) + 1477 Hz (col 3)
    // Row 4 (941 Hz): *, 0, #
    '*': [941, 1209],  // 941 Hz (row) + 1209 Hz (col 1)
    '0': [941, 1336],  // 941 Hz (row) + 1336 Hz (col 2)
    '#': [941, 1477]   // 941 Hz (row) + 1477 Hz (col 3)
  }

  const playDTMFTone = async (digit: string) => {
    // Ensure audio context exists and is resumed (critical for mobile)
    await ensureAudioContextResumed()
    
    if (!audioContextRef.current) {
      console.warn('AudioContext not available')
      return
    }

    const frequencies = dtmfFrequencies[digit]
    if (!frequencies) return

    const context = audioContextRef.current
    
    // Double-check context is running (mobile browsers can be finicky)
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch (error) {
        console.warn('Could not resume audio context for DTMF tone:', error)
        return
      }
    }
    // Standard DTMF tone duration: 50-100ms (using 80ms for better audibility)
    const duration = 0.08
    const sampleRate = context.sampleRate
    const numSamples = Math.floor(duration * sampleRate)

    // Create buffer for the tone
    const buffer = context.createBuffer(1, numSamples, sampleRate)
    const data = buffer.getChannelData(0)

    // Generate the dual-tone signal with proper DTMF characteristics
    // DTMF tones use equal amplitude for both frequencies
    const lowFreq = frequencies[0]   // Low frequency (row)
    const highFreq = frequencies[1]  // High frequency (column)
    
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate
      
      // Generate pure sine waves for both frequencies
      const lowTone = Math.sin(2 * Math.PI * lowFreq * t)
      const highTone = Math.sin(2 * Math.PI * highFreq * t)
      
      // Combine with equal amplitude (standard DTMF specification)
      const combined = (lowTone + highTone) * 0.5
      
      // Apply envelope: quick attack, sustain, quick release
      // This prevents clicks and makes tones sound cleaner
      let envelope = 1.0
      const attackTime = 0.005  // 5ms attack
      const releaseTime = 0.010  // 10ms release
      
      if (t < attackTime) {
        envelope = t / attackTime  // Linear attack
      } else if (t > duration - releaseTime) {
        envelope = (duration - t) / releaseTime  // Linear release
      }
      
      // Apply envelope and scale to appropriate volume
      data[i] = combined * envelope * 0.4
    }

    // Play through Web Audio API and connect to analyser for visualization
    try {
      const source = context.createBufferSource()
      const gainNode = context.createGain()
      
      gainNode.gain.setValueAtTime(0, context.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.4, context.currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(0.4, context.currentTime + duration - 0.01)
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + duration)

      source.buffer = buffer
      source.connect(gainNode)
      
      // Connect to analyser for visualization
      if (analyserRef.current) {
        gainNode.connect(analyserRef.current)
      }
      
      // Also connect to destination for audio output
      gainNode.connect(context.destination)
      
      source.start(0)
      source.stop(context.currentTime + duration)
    } catch (error) {
      console.warn('Could not play DTMF tone:', error)
    }
  }

  const handleKeypadClick = async (digit: string) => {
    // Validate digit is safe (only allow keypad characters)
    const safeDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '#', '+']
    if (!safeDigits.includes(digit)) {
      return
    }
    
    // Limit to 15 digits to prevent wrapping
    if (phoneNumber.length < 15) {
      const newNumber = phoneNumber + digit
      // Additional validation for defense in depth
      if (isValidPhoneNumber(newNumber, 15)) {
        setPhoneNumber(newNumber)
        // Play tone - ensure audio context is resumed (critical for mobile)
        await playDTMFTone(digit)
      }
    }
  }

  const handleBackspace = async () => {
    setPhoneNumber(prev => {
      const newNumber = sanitizePhoneNumber(prev.slice(0, -1), 15)
      if (newNumber.length < prev.length) {
        // Play a subtle tone for backspace (async for mobile compatibility)
        playDTMFTone('*').catch(err => console.warn('Could not play backspace tone:', err))
      }
      return newNumber
    })
  }

  const handleClear = async () => {
    if (phoneNumber.length > 0) {
      // Play a tone for clear (async for mobile compatibility)
      await playDTMFTone('#')
    }
    setPhoneNumber('')
  }
  
  // Validate phone number on render (defense in depth)
  useEffect(() => {
    if (phoneNumber && !isValidPhoneNumber(phoneNumber, 15)) {
      // Sanitize if invalid
      setPhoneNumber(sanitizePhoneNumber(phoneNumber, 15))
    }
  }, [phoneNumber])

  const handleClosePhone = () => {
    // Try to go back in history, with fallback to /more
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      // Fallback: navigate to /more if no history
      navigate('/more')
    }
  }

  const phoneKeypad = [
    [{ digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' }],
    [{ digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' }],
    [{ digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' }],
    [{ digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' }]
  ]

  return (
    <Layout>
      <div className="phone-container">
        <div className="phone-screen">
          <div className="phone-oscilloscope-container">
            <div className="phone-oscilloscope-header">
              <span className="phone-oscilloscope-title">Audio Visualizer</span>
              <button
                className={`phone-mic-button ${micEnabled ? 'active' : ''}`}
                onClick={handleMicToggle}
                title={micEnabled ? 'Disable microphone' : 'Enable microphone'}
              >
                {micEnabled ? '🎤' : '🎙️'}
              </button>
            </div>
            <canvas
              ref={canvasRef}
              className="phone-oscilloscope"
            />
          </div>
          <div className="phone-display">
            <div 
              className="phone-number-display"
              style={{
                fontSize: phoneNumber.length > 10 
                  ? `${Math.max(1, 2 - (phoneNumber.length - 10) * 0.15)}rem`
                  : '2rem'
              }}
            >
              {phoneNumber || <span className="phone-placeholder">Enter number</span>}
            </div>
          </div>
          <div className="phone-keypad">
            {phoneKeypad.map((row, rowIndex) => (
              <div key={rowIndex} className="phone-keypad-row">
                {row.map((key) => (
                  <button
                    key={key.digit}
                    className="phone-key"
                    onClick={() => handleKeypadClick(key.digit)}
                  >
                    <span className="phone-key-digit">{key.digit}</span>
                    {key.letters && <span className="phone-key-letters">{key.letters}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="phone-actions">
            <button className="phone-action-button phone-back-button" onClick={handleClosePhone}>
              ← Back
            </button>
            <button className="phone-action-button phone-backspace-button" onClick={handleBackspace}>
              ⌫
            </button>
            <button className="phone-action-button phone-call-button" disabled>
              📞
            </button>
            <button className="phone-action-button" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default ContactMe

