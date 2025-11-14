import { useState, useRef, useEffect } from 'react'
import Layout from '../components/Layout'
import './PageStyles.css'
import './Contact.css'

interface AudioDevice {
  deviceId: string
  label: string
  kind: string
}

const Contact = () => {
  const [showPhone, setShowPhone] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default')
  const [showDeviceSelector, setShowDeviceSelector] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const longPressTimerRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize Audio Context, analyser, and enumerate devices when phone is shown
  useEffect(() => {
    if (showPhone) {
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }

      // Create analyser node for visualization
      if (!analyserRef.current && audioContextRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        analyserRef.current.smoothingTimeConstant = 0.8
      }

      // Enumerate audio output devices
      enumerateAudioDevices()
      
      // Start visualization after a short delay to ensure canvas is rendered
      setTimeout(() => {
        startVisualization()
      }, 100)
    }

    return () => {
      // Stop visualization
      stopVisualization()
      
      // Stop microphone if active
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
        micStreamRef.current = null
      }
      
      // Clean up audio context when component unmounts
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
      if (audioElementRef.current) {
        audioElementRef.current = null
      }
      analyserRef.current = null
    }
  }, [showPhone])

  const enumerateAudioDevices = async () => {
    try {
      // First, try to enumerate devices without requesting permission
      let devices = await navigator.mediaDevices.enumerateDevices()
      
      // Check if we have device labels (requires permission)
      const hasLabels = devices.some(device => device.label && device.label !== '')
      
      // If no labels, request permission to get proper device names
      if (!hasLabels) {
        try {
          // Request minimal permission to get device labels
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          // Stop the stream immediately - we only needed it for permission
          stream.getTracks().forEach(track => track.stop())
          // Enumerate again to get devices with labels
          devices = await navigator.mediaDevices.enumerateDevices()
        } catch (permissionError) {
          console.warn('Permission denied for device enumeration:', permissionError)
          // Continue with devices without labels
        }
      }
      
      // Filter for audio output devices
      const audioOutputs = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Audio Output ${device.deviceId.slice(0, 8)}`,
          kind: device.kind
        }))

      // Add default option
      const defaultDevice: AudioDevice = {
        deviceId: 'default',
        label: 'Default Speaker',
        kind: 'audiooutput'
      }

      setAudioDevices([defaultDevice, ...audioOutputs])
    } catch (error) {
      console.warn('Could not enumerate audio devices:', error)
      // Fallback to default
      setAudioDevices([{
        deviceId: 'default',
        label: 'Default Speaker',
        kind: 'audiooutput'
      }])
    }
  }

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId)
    // Test the device selection by playing a brief tone
    if (deviceId !== 'default') {
      await testAudioOutput(deviceId)
    }
  }

  const testAudioOutput = async (deviceId: string) => {
    try {
      // Create a test audio element
      const testAudio = new Audio()
      
      // Set the sink ID if supported
      if ('setSinkId' in testAudio && typeof (testAudio as any).setSinkId === 'function') {
        await (testAudio as any).setSinkId(deviceId)
      }
      
      // Create a simple test tone
      const context = audioContextRef.current
      if (!context) return

      const duration = 0.05
      const sampleRate = context.sampleRate
      const numSamples = duration * sampleRate
      const buffer = context.createBuffer(1, numSamples, sampleRate)
      const data = buffer.getChannelData(0)

      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate
        data[i] = Math.sin(2 * Math.PI * 800 * t) * 0.1
      }

      // Convert buffer to audio element
      const blob = await bufferToWav(buffer)
      const url = URL.createObjectURL(blob)
      testAudio.src = url
      testAudio.volume = 0.3
      
      if ('setSinkId' in testAudio && typeof (testAudio as any).setSinkId === 'function') {
        await (testAudio as any).setSinkId(deviceId)
      }
      
      testAudio.play().then(() => {
        setTimeout(() => {
          testAudio.pause()
          URL.revokeObjectURL(url)
        }, duration * 1000)
      })
    } catch (error) {
      console.warn('Could not test audio output:', error)
    }
  }

  const bufferToWav = async (buffer: AudioBuffer): Promise<Blob> => {
    const length = buffer.length
    const sampleRate = buffer.sampleRate
    const arrayBuffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(arrayBuffer)
    const data = buffer.getChannelData(0)
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, 1, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * 2, true)
    view.setUint16(32, 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)
    
    // Convert float samples to 16-bit PCM
    let offset = 44
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, data[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
      offset += 2
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

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

      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(10, 10, 30, 0.95)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)')
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

      // Draw center waveform line (optional overlay)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
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

      // Draw particles/sparkles for high energy frequencies
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
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

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const handleMicToggle = async () => {
    if (micEnabled) {
      // Disable microphone
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
        micStreamRef.current = null
      }
      setMicEnabled(false)
    } else {
      // Enable microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
        setMicPermissionGranted(true)
        setMicEnabled(true)

        // Connect microphone to analyser
        if (audioContextRef.current && analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          source.connect(analyserRef.current)
        }
      } catch (error) {
        console.warn('Microphone access denied:', error)
        setMicPermissionGranted(false)
        setMicEnabled(false)
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
    if (!audioContextRef.current) return

    const frequencies = dtmfFrequencies[digit]
    if (!frequencies) return

    const context = audioContextRef.current
    
    // Resume audio context if suspended (required by some browsers)
    if (context.state === 'suspended') {
      await context.resume()
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

      // Also play through HTMLAudioElement for device selection
      try {
        const blob = await bufferToWav(buffer)
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.volume = 0 // Mute this since we're playing through Web Audio API
        audio.play().then(() => {
          setTimeout(() => {
            audio.pause()
            audio.src = ''
            URL.revokeObjectURL(url)
          }, duration * 1000 + 50)
        })
      } catch (wavError) {
        // Ignore WAV conversion errors, Web Audio API playback is primary
      }
    } catch (error) {
      console.warn('Could not play DTMF tone:', error)
    }
  }

  const handleEmailClick = () => {
    const subject = encodeURIComponent('Let\'s talk!')
    const body = encodeURIComponent('Hello Ingredients!\n\nI would like to talk about...')
    window.location.href = `mailto:theingredientscollective@gmail.com?subject=${subject}&body=${body}`
  }

  const handleAudioClick = () => {
    window.open('https://or-six.vercel.app/', '_blank', 'noopener,noreferrer')
  }

  const handleContactPressStart = () => {
    const timer = window.setTimeout(() => {
      setShowPhone(true)
      setPhoneNumber('')
    }, 500) // 500ms hold duration
    
    longPressTimerRef.current = timer
  }

  const handleContactPressEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleContactMouseDown = () => {
    handleContactPressStart()
  }

  const handleContactMouseUp = () => {
    handleContactPressEnd()
  }

  const handleContactMouseLeave = () => {
    handleContactPressEnd()
  }

  const handleContactTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    handleContactPressStart()
  }

  const handleContactTouchEnd = () => {
    handleContactPressEnd()
  }

  const handleContactTouchCancel = () => {
    handleContactPressEnd()
  }

  const handleKeypadClick = (digit: string) => {
    // Limit to 15 digits to prevent wrapping
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit)
      playDTMFTone(digit)
    }
  }

  const handleBackspace = () => {
    setPhoneNumber(prev => {
      const newNumber = prev.slice(0, -1)
      if (newNumber.length < prev.length) {
        // Play a subtle tone for backspace
        playDTMFTone('*')
      }
      return newNumber
    })
  }

  const handleClear = () => {
    if (phoneNumber.length > 0) {
      // Play a tone for clear
      playDTMFTone('#')
    }
    setPhoneNumber('')
  }

  const handleClosePhone = () => {
    setShowPhone(false)
    setPhoneNumber('')
  }

  const phoneKeypad = [
    [{ digit: '1', letters: '' }, { digit: '2', letters: 'ABC' }, { digit: '3', letters: 'DEF' }],
    [{ digit: '4', letters: 'GHI' }, { digit: '5', letters: 'JKL' }, { digit: '6', letters: 'MNO' }],
    [{ digit: '7', letters: 'PQRS' }, { digit: '8', letters: 'TUV' }, { digit: '9', letters: 'WXYZ' }],
    [{ digit: '*', letters: '' }, { digit: '0', letters: '+' }, { digit: '#', letters: '' }]
  ]

  if (showPhone) {
    return (
      <Layout>
        <div className="phone-container">
          <div className="phone-screen">
            <div className="phone-header">
              <button className="phone-close-button" onClick={handleClosePhone}>
                ← Back
              </button>
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
              <button className="phone-action-button" onClick={handleBackspace}>
                ⌫
              </button>
              <button className="phone-action-button phone-call-button" onClick={handleClosePhone}>
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

  return (
    <Layout>
      <div className="page-container">
        <h1 
          className="page-title contact-title"
          onMouseDown={handleContactMouseDown}
          onMouseUp={handleContactMouseUp}
          onMouseLeave={handleContactMouseLeave}
          onTouchStart={handleContactTouchStart}
          onTouchEnd={handleContactTouchEnd}
          onTouchCancel={handleContactTouchCancel}
          aria-label="Hold to activate easter egg"
          title="Hold to activate easter egg"
        >
          Contact
        </h1>
        <p className="page-content">Get in touch with us.</p>
        {/* <p className="page-content">Create a audio file for us using <a href="https://or-six.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-link">
          The OR (beta)
        </a>.</p> */}
        <button onClick={handleEmailClick} className="email-button">
          Email Us
        </button>
        <button onClick={handleAudioClick} className="email-button">
          Create Audio With Us
        </button>
      </div>
    </Layout>
  )
}

export default Contact

