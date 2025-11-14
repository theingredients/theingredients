# Audio Visualizer Feature - Microphone Detection Baseline

This document explains how to use the audio visualizer code from this project as a baseline for implementing microphone-on detection and visualization in another application.

## Overview

The visualizer implementation provides:
- Real-time audio frequency visualization using Web Audio API
- Microphone input detection and visualization
- Canvas-based animated frequency bars
- Smooth animations with theme-aware styling
- Proper cleanup and resource management

## Core Components

### 1. Audio Context & Analyser Setup

The visualizer uses the Web Audio API to process audio data:

```typescript
// Initialize Audio Context
const audioContextRef = useRef<AudioContext | null>(null)
const analyserRef = useRef<AnalyserNode | null>(null)
const micStreamRef = useRef<MediaStream | null>(null)

// Create audio context (with fallback for older browsers)
audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()

// Create analyser node for frequency analysis
analyserRef.current = audioContextRef.current.createAnalyser()
analyserRef.current.fftSize = 2048  // Higher = more frequency resolution
analyserRef.current.smoothingTimeConstant = 0.8  // Smooth transitions
```

**Key Settings:**
- `fftSize`: Controls frequency resolution (256, 512, 1024, 2048, etc.)
- `smoothingTimeConstant`: 0.0 = no smoothing, 1.0 = maximum smoothing (0.8 recommended)

### 2. Microphone Access & Connection

To enable microphone input:

```typescript
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
      setMicEnabled(true)

      // Connect microphone to analyser
      if (audioContextRef.current && analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(stream)
        source.connect(analyserRef.current)
      }
    } catch (error) {
      console.warn('Microphone access denied:', error)
      setMicEnabled(false)
    }
  }
}
```

**Important Notes:**
- `getUserMedia()` requires HTTPS (or localhost) in most browsers
- User must grant microphone permission
- Always stop tracks when disabling to free resources

### 3. Canvas Visualization

The visualizer draws animated frequency bars on a canvas:

```typescript
const canvasRef = useRef<HTMLCanvasElement | null>(null)
const animationFrameRef = useRef<number | null>(null)

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
  
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'

  const analyser = analyserRef.current
  analyser.fftSize = 256  // Good balance for visualizer
  analyser.smoothingTimeConstant = 0.8
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  
  // Store previous values for smooth transitions
  const previousValues = new Array(bufferLength).fill(0)
  
  let animationTime = 0

  const draw = () => {
    animationFrameRef.current = requestAnimationFrame(draw)

    // Get frequency domain data (0-255 values)
    analyser.getByteFrequencyData(dataArray)

    const width = rect.width
    const height = rect.height
    animationTime += 0.02

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw frequency bars
    const barCount = 64
    const barWidth = width / barCount
    
    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * bufferLength)
      const value = dataArray[binIndex]
      const normalizedValue = value / 255
      
      // Smooth the value
      previousValues[i] = Math.max(previousValues[i] * 0.7, normalizedValue)
      const smoothedValue = previousValues[i]
      
      // Calculate bar height
      const barHeight = smoothedValue * height * 0.9
      const x = i * barWidth
      
      // Draw bar
      ctx.fillStyle = `hsl(${(i / barCount) * 360}, 80%, 50%)`
      ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight)
    }
  }

  draw()
}
```

### 4. Cleanup

Always clean up resources when component unmounts:

```typescript
useEffect(() => {
  // ... initialization code ...

  return () => {
    // Stop visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    // Stop microphone if active
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop())
      micStreamRef.current = null
    }
    
    // Clean up audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    analyserRef.current = null
  }
}, [])
```

## Integration Guide for Another App

### Step 1: Copy Core Logic

Extract these key parts from `src/pages/ContactMe.tsx`:

1. **State & Refs** (lines 9-14):
   - `micEnabled` state
   - `audioContextRef`, `analyserRef`, `micStreamRef`
   - `canvasRef`, `animationFrameRef`

2. **Initialization** (lines 45-80):
   - Audio context creation
   - Analyser node setup
   - Visualization start

3. **Microphone Toggle** (lines 250-275):
   - `handleMicToggle` function

4. **Visualization** (lines 82-241):
   - `startVisualization` function
   - `stopVisualization` function

### Step 2: Minimal Implementation

Here's a minimal standalone version:

```typescript
import { useState, useRef, useEffect } from 'react'

const AudioVisualizer = () => {
  const [micEnabled, setMicEnabled] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    analyserRef.current = audioContextRef.current.createAnalyser()
    analyserRef.current.fftSize = 256
    analyserRef.current.smoothingTimeConstant = 0.8

    startVisualization()

    return () => {
      stopVisualization()
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [])

  const startVisualization = () => {
    if (!canvasRef.current || !analyserRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'

    const analyser = analyserRef.current
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    const previousValues = new Array(bufferLength).fill(0)

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      const barCount = 64
      const barWidth = width / barCount

      for (let i = 0; i < barCount; i++) {
        const binIndex = Math.floor((i / barCount) * bufferLength)
        const value = dataArray[binIndex] / 255
        previousValues[i] = Math.max(previousValues[i] * 0.7, value)
        const barHeight = previousValues[i] * height * 0.9

        ctx.fillStyle = `hsl(${(i / barCount) * 360}, 80%, 50%)`
        ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight)
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
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop())
        micStreamRef.current = null
      }
      setMicEnabled(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = stream
        setMicEnabled(true)

        if (audioContextRef.current && analyserRef.current) {
          const source = audioContextRef.current.createMediaStreamSource(stream)
          source.connect(analyserRef.current)
        }
      } catch (error) {
        console.warn('Microphone access denied:', error)
        setMicEnabled(false)
      }
    }
  }

  return (
    <div>
      <button onClick={handleMicToggle}>
        {micEnabled ? '🎤 Mic On' : '🎙️ Mic Off'}
      </button>
      <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }} />
    </div>
  )
}
```

### Step 3: Detecting When Microphone is On

The `micEnabled` state tracks microphone status. You can use it to:

1. **Show visual indicators:**
```typescript
{micEnabled && <div>Microphone is active</div>}
```

2. **Trigger actions:**
```typescript
useEffect(() => {
  if (micEnabled) {
    // Microphone just turned on
    console.log('Microphone is now active')
    // Start recording, show UI, etc.
  } else {
    // Microphone just turned off
    console.log('Microphone is now inactive')
    // Stop recording, hide UI, etc.
  }
}, [micEnabled])
```

3. **Check audio levels:**
```typescript
const checkAudioLevel = () => {
  if (!analyserRef.current || !micEnabled) return false
  
  const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
  analyserRef.current.getByteFrequencyData(dataArray)
  
  // Calculate average volume
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length
  return average > 10  // Threshold for "sound detected"
}
```

## Key Features from Original Implementation

### 1. Smooth Animations
- Uses `previousValues` array to smooth bar transitions
- `smoothingTimeConstant` on analyser for frequency smoothing

### 2. High DPI Support
- Scales canvas for retina displays using `devicePixelRatio`

### 3. Theme Awareness
- Checks `document.body.classList.contains('theme-dark')` for dark mode
- Adjusts colors accordingly

### 4. Advanced Visual Effects
- Gradient backgrounds
- Glow effects on active bars
- Particle effects for high-energy frequencies
- Waveform overlay

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (may need user gesture to start audio context)
- **Mobile**: Works on iOS Safari and Chrome Android

**Note**: Some browsers require a user interaction (click) before starting audio context. The original implementation handles this by starting visualization on mount, but you may need to trigger it from a button click in some cases.

## Common Issues & Solutions

### Issue: Audio context suspended
**Solution**: Resume the context when needed:
```typescript
if (audioContextRef.current?.state === 'suspended') {
  await audioContextRef.current.resume()
}
```

### Issue: No visualization when mic is off
**Solution**: The visualizer still runs even without microphone input. You can check `micEnabled` to show different states or connect other audio sources.

### Issue: Permission denied
**Solution**: Always handle errors gracefully and provide user feedback:
```typescript
catch (error) {
  if (error.name === 'NotAllowedError') {
    alert('Microphone permission denied. Please enable in browser settings.')
  }
}
```

## Customization Options

### Adjust Visual Style
- Change `barCount` for more/fewer bars
- Modify color calculations in the draw loop
- Adjust `smoothingTimeConstant` for more/less smoothing
- Change `fftSize` for different frequency resolution

### Add Features
- Volume meter (average of `dataArray`)
- Frequency peak detection
- Audio recording while visualizing
- Multiple visualization modes (bars, waveform, circle, etc.)

## File References

Original implementation:
- **Component**: `src/pages/ContactMe.tsx` (lines 1-496)
- **Styles**: `src/pages/Contact.css` (lines 300-401)

Key functions:
- `startVisualization()`: Lines 82-241
- `stopVisualization()`: Lines 243-248
- `handleMicToggle()`: Lines 250-275
- Initialization: Lines 45-80

## License & Usage

This code is provided as a reference implementation. Feel free to adapt it for your own projects. The visualizer uses standard Web Audio API and Canvas APIs, so it's compatible with any modern web framework.

