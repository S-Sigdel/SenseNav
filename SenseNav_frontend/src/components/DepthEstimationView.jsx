import React, { useState, useRef, useEffect } from 'react'

const DepthEstimationView = ({ onCentroidUpdate }) => {
  const [status, setStatus] = useState('Initializing depth estimation...')
  const [stream, setStream] = useState(null)
  const [centroidData, setCentroidData] = useState(null)
  const [fps, setFps] = useState(0)
  const [lastCentroidUpdate, setLastCentroidUpdate] = useState(0)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const depthCanvasRef = useRef(null)
  const animationRef = useRef(null)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(Date.now())

  useEffect(() => {
    const startCamera = async () => {
      try {
        setStatus('Requesting camera access...')
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 320 },
            height: { ideal: 240 }
          },
          audio: false
        })
        
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          console.log('Camera stream set:', mediaStream)
        }
        setStatus('Camera active - processing depth...')
        
      } catch (error) {
        console.error('Camera access failed:', error)
        setStatus(`Camera error: ${error.message}`)
      }
    }

    startCamera()

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Enhanced depth estimation using multiple features
  const estimateDepth = (imageData) => {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    
    // Create depth map with more variation
    const depthMap = new Array(width * height)
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        
        // Calculate multiple depth cues
        const brightness = (r + g + b) / 3
        
        // Edge detection (Sobel-like)
        let edgeStrength = 0
        if (x > 0 && y > 0 && x < width - 1 && y < height - 1) {
          // Sobel X
          const gx = 
            -1 * getBrightness(data, x-1, y-1, width) + 1 * getBrightness(data, x+1, y-1, width) +
            -2 * getBrightness(data, x-1, y, width) + 2 * getBrightness(data, x+1, y, width) +
            -1 * getBrightness(data, x-1, y+1, width) + 1 * getBrightness(data, x+1, y+1, width)
          
          // Sobel Y
          const gy = 
            -1 * getBrightness(data, x-1, y-1, width) + -2 * getBrightness(data, x, y-1, width) + -1 * getBrightness(data, x+1, y-1, width) +
             1 * getBrightness(data, x-1, y+1, width) +  2 * getBrightness(data, x, y+1, width) +  1 * getBrightness(data, x+1, y+1, width)
          
          edgeStrength = Math.sqrt(gx * gx + gy * gy)
        }
        
        // Color-based depth estimation
        // Objects closer to camera tend to have more contrast and saturation
        const saturation = Math.max(r, g, b) - Math.min(r, g, b)
        const contrast = Math.abs(brightness - 128) / 128
        
        // Distance from center (objects in center are often closer)
        const centerX = width / 2
        const centerY = height / 2
        const distanceFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
        const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2)
        const centerWeight = 1 - (distanceFromCenter / maxDistance)
        
        // Add more depth variation with additional features
        const textureVariation = calculateTextureVariation(data, x, y, width, height)
        const colorDistance = calculateColorDistance(r, g, b)
        const spatialFrequency = calculateSpatialFrequency(data, x, y, width, height)
        
        // Combine all depth cues with enhanced weights for MAXIMUM variation
        const depthValue = (
          brightness * 0.25 +          // Brightness contributes 25%
          edgeStrength * 0.3 +         // Edge strength contributes 30%
          saturation * 0.15 +          // Saturation contributes 15%
          contrast * 0.1 +             // Contrast contributes 10%
          textureVariation * 0.1 +     // Texture variation contributes 10%
          colorDistance * 0.05 +       // Color distance contributes 5%
          spatialFrequency * 0.05      // Spatial frequency contributes 5%
        ) * centerWeight               // Apply center weighting
        
        depthMap[y * width + x] = depthValue
      }
    }
    
    // Debug: Log depth statistics (reduced frequency)
    if (Math.random() < 0.01) { // Only log 1% of the time
      const minDepth = Math.min(...depthMap)
      const maxDepth = Math.max(...depthMap)
      const avgDepth = depthMap.reduce((a, b) => a + b, 0) / depthMap.length
      console.log('Depth map stats:', { minDepth, maxDepth, avgDepth, totalPixels: depthMap.length })
    }
    
    return depthMap
  }

  // Helper function to get brightness at a specific pixel
  const getBrightness = (data, x, y, width) => {
    if (x < 0 || x >= width || y < 0 || y >= data.length / (width * 4)) return 0
    const idx = (y * width + x) * 4
    return (data[idx] + data[idx + 1] + data[idx + 2]) / 3
  }

  // Calculate texture variation in a 3x3 neighborhood
  const calculateTextureVariation = (data, x, y, width, height) => {
    if (x < 1 || x >= width - 1 || y < 1 || y >= height - 1) return 0
    
    let variation = 0
    const centerBrightness = getBrightness(data, x, y, width)
    
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const neighborBrightness = getBrightness(data, x + dx, y + dy, width)
        variation += Math.abs(centerBrightness - neighborBrightness)
      }
    }
    
    return variation / 8 // Average variation
  }

  // Calculate color distance from neutral gray
  const calculateColorDistance = (r, g, b) => {
    const gray = (r + g + b) / 3
    return Math.sqrt((r - gray) ** 2 + (g - gray) ** 2 + (b - gray) ** 2)
  }

  // Calculate spatial frequency (how much the image changes)
  const calculateSpatialFrequency = (data, x, y, width, height) => {
    if (x < 2 || x >= width - 2 || y < 2 || y >= height - 2) return 0
    
    let frequency = 0
    const centerBrightness = getBrightness(data, x, y, width)
    
    // Check 5x5 neighborhood for frequency
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (dx === 0 && dy === 0) continue
        const neighborBrightness = getBrightness(data, x + dx, y + dy, width)
        const distance = Math.sqrt(dx * dx + dy * dy)
        frequency += Math.abs(centerBrightness - neighborBrightness) / distance
      }
    }
    
    return frequency / 24 // Average frequency
  }

  // Classify direction into specific categories for better spatial audio
  const classifyDirection = (x, y, width, height) => {
    const centerX = width / 2
    const centerY = height / 2
    
    // Calculate relative position (0-1 range)
    const relX = x / width
    const relY = y / height
    
    // Define directional zones with specific ranges
    let horizontalZone, verticalZone, distance
    
    // Horizontal classification (Left to Right)
    if (relX < 0.2) {
      horizontalZone = 'Far Left'
    } else if (relX < 0.35) {
      horizontalZone = 'Left'
    } else if (relX < 0.5) {
      horizontalZone = 'Center-Left'
    } else if (relX < 0.65) {
      horizontalZone = 'Center-Right'
    } else if (relX < 0.8) {
      horizontalZone = 'Right'
    } else {
      horizontalZone = 'Far Right'
    }
    
    // Vertical classification (Top to Bottom)
    if (relY < 0.2) {
      verticalZone = 'Far Top'
    } else if (relY < 0.35) {
      verticalZone = 'Top'
    } else if (relY < 0.5) {
      verticalZone = 'Center-Top'
    } else if (relY < 0.65) {
      verticalZone = 'Center-Bottom'
    } else if (relY < 0.8) {
      verticalZone = 'Bottom'
    } else {
      verticalZone = 'Far Bottom'
    }
    
    // Distance from center (for proximity-based audio)
    const distanceFromCenter = Math.sqrt(
      Math.pow((x - centerX) / centerX, 2) + 
      Math.pow((y - centerY) / centerY, 2)
    )
    
    if (distanceFromCenter < 0.2) {
      distance = 'Very Close'
    } else if (distanceFromCenter < 0.4) {
      distance = 'Close'
    } else if (distanceFromCenter < 0.6) {
      distance = 'Medium'
    } else if (distanceFromCenter < 0.8) {
      distance = 'Far'
    } else {
      distance = 'Very Far'
    }
    
    // Create combined direction string
    const combinedDirection = `${horizontalZone} ${verticalZone} (${distance})`
    
    return {
      horizontal: horizontalZone,
      vertical: verticalZone,
      distance: distance,
      combined: combinedDirection,
      relX: relX,
      relY: relY,
      distanceFromCenter: distanceFromCenter
    }
  }

  // Find centroid of closest objects (similar to Python code)
  const findCentroid = (depthMap, width, height) => {
    // Find the top 5% of pixels (highest depth values = closest objects)
    // This will make the detection more sensitive to changes
    const sortedDepths = [...depthMap].sort((a, b) => b - a)
    const threshold = sortedDepths[Math.floor(sortedDepths.length * 0.05)]
    
    // Create mask for closest pixels
    const mask = depthMap.map(d => d >= threshold ? 1 : 0)
    
    // Find connected components (simplified)
    let totalX = 0, totalY = 0, count = 0
    let minX = width, maxX = 0, minY = height, maxY = 0
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x
        if (mask[idx]) {
          totalX += x
          totalY += y
          count++
          minX = Math.min(minX, x)
          maxX = Math.max(maxX, x)
          minY = Math.min(minY, y)
          maxY = Math.max(maxY, y)
        }
      }
    }
    
    if (count < 30) return null // Lower minimum area threshold for more sensitivity
    
    const centroidX = Math.round(totalX / count)
    const centroidY = Math.round(totalY / count)
    
    // Calculate both pixel count and bounding box area for more dynamic updates
    const pixelArea = count
    const bbox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
    const bboxArea = bbox.width * bbox.height
    
    // Use a combination of pixel count and bounding box area for more responsive area calculation
    const area = Math.round((pixelArea + bboxArea) / 2)
    
    // Classify direction into specific categories
    const direction = classifyDirection(centroidX, centroidY, width, height)
    
    // Only log every 100th frame to reduce console spam
    if (Math.random() < 0.01) {
      console.log('Centroid calculation:', { 
        threshold: threshold.toFixed(2), 
        pixelCount: count,
        pixelArea,
        bboxArea,
        combinedArea: area,
        centroidX, 
        centroidY, 
        bbox,
        direction: direction.combined,
        totalPixels: depthMap.length,
        thresholdPercent: (count / depthMap.length * 100).toFixed(1) + '%'
      })
    }
    
    return { x: centroidX, y: centroidY, area, bbox, direction }
  }

  // ULTRA colorize depth map with MAXIMUM color variation
  const colorizeDepth = (depthMap, width, height) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = width
    canvas.height = height
    
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data
    
    const minDepth = Math.min(...depthMap)
    const maxDepth = Math.max(...depthMap)
    const range = maxDepth - minDepth
    
    for (let i = 0; i < depthMap.length; i++) {
      const normalized = range > 0 ? (depthMap[i] - minDepth) / range : 0
      
      // ULTRA colormap: Purple -> Blue -> Cyan -> Green -> Yellow -> Orange -> Red -> Magenta
      // This creates MAXIMUM color variation across the entire spectrum
      let r, g, b
      
      if (normalized < 0.125) {
        // Purple to Blue (closest objects)
        const t = normalized / 0.125
        r = Math.round(128 - t * 128)
        g = Math.round(0)
        b = Math.round(255)
      } else if (normalized < 0.25) {
        // Blue to Cyan
        const t = (normalized - 0.125) / 0.125
        r = Math.round(0)
        g = Math.round(t * 255)
        b = Math.round(255)
      } else if (normalized < 0.375) {
        // Cyan to Green
        const t = (normalized - 0.25) / 0.125
        r = Math.round(0)
        g = Math.round(255)
        b = Math.round(255 - t * 255)
      } else if (normalized < 0.5) {
        // Green to Yellow
        const t = (normalized - 0.375) / 0.125
        r = Math.round(t * 255)
        g = Math.round(255)
        b = Math.round(0)
      } else if (normalized < 0.625) {
        // Yellow to Orange
        const t = (normalized - 0.5) / 0.125
        r = Math.round(255)
        g = Math.round(255 - t * 128)
        b = Math.round(0)
      } else if (normalized < 0.75) {
        // Orange to Red
        const t = (normalized - 0.625) / 0.125
        r = Math.round(255)
        g = Math.round(127 - t * 127)
        b = Math.round(0)
      } else if (normalized < 0.875) {
        // Red to Pink
        const t = (normalized - 0.75) / 0.125
        r = Math.round(255)
        g = Math.round(t * 128)
        b = Math.round(t * 128)
      } else {
        // Pink to Magenta (farthest objects)
        const t = (normalized - 0.875) / 0.125
        r = Math.round(255)
        g = Math.round(128 - t * 128)
        b = Math.round(128 + t * 127)
      }
      
      const pixelIdx = i * 4
      data[pixelIdx] = r
      data[pixelIdx + 1] = g
      data[pixelIdx + 2] = b
      data[pixelIdx + 3] = 255
    }
    
    ctx.putImageData(imageData, 0, 0)
    return canvas
  }

  // Main processing loop
  useEffect(() => {
    if (!stream) return

    let lastFrameTime = 0
    const targetFPS = 10 // Further reduce to 10 FPS to eliminate glitching
    const frameInterval = 1000 / targetFPS

    const processFrame = (currentTime) => {
      if (!videoRef.current || !depthCanvasRef.current) {
        animationRef.current = requestAnimationFrame(processFrame)
        return
      }

      // Frame rate limiting
      if (currentTime - lastFrameTime < frameInterval) {
        animationRef.current = requestAnimationFrame(processFrame)
        return
      }
      lastFrameTime = currentTime

      const video = videoRef.current
      if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
        try {
          // Create a temporary canvas to get image data
          const tempCanvas = document.createElement('canvas')
          const tempCtx = tempCanvas.getContext('2d')
          tempCanvas.width = video.videoWidth
          tempCanvas.height = video.videoHeight
          tempCtx.drawImage(video, 0, 0)
          
          // Get image data for depth estimation
          const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
          
          // Estimate depth
          const depthMap = estimateDepth(imageData)
          
          // Find centroid
          const centroid = findCentroid(depthMap, tempCanvas.width, tempCanvas.height)
          
          // Debounce centroid updates to prevent excessive re-renders
          const currentTime = Date.now()
          if (currentTime - lastCentroidUpdate > 100) { // Update at most every 100ms
            setCentroidData(centroid)
            setLastCentroidUpdate(currentTime)
            if (onCentroidUpdate) {
              onCentroidUpdate(centroid)
            }
          }
          
          // Create colorized depth map
          const depthCanvas = depthCanvasRef.current
          const depthCtx = depthCanvas.getContext('2d')
          depthCanvas.width = tempCanvas.width
          depthCanvas.height = tempCanvas.height
          
          const colorizedDepth = colorizeDepth(depthMap, tempCanvas.width, tempCanvas.height)
          depthCtx.drawImage(colorizedDepth, 0, 0)
          
          // Draw centroid on depth map
          if (centroid) {
            depthCtx.beginPath()
            depthCtx.arc(centroid.x, centroid.y, 10, 0, 2 * Math.PI)
            depthCtx.fillStyle = '#00ff00'
            depthCtx.fill()
            
            depthCtx.beginPath()
            depthCtx.arc(centroid.x, centroid.y, 15, 0, 2 * Math.PI)
            depthCtx.strokeStyle = '#ff0000'
            depthCtx.lineWidth = 2
            depthCtx.stroke()
            
            // Draw bounding box
            depthCtx.strokeStyle = '#ffff00'
            depthCtx.lineWidth = 2
            depthCtx.strokeRect(centroid.bbox.x, centroid.bbox.y, centroid.bbox.width, centroid.bbox.height)
          }
          
          // Calculate FPS
          frameCountRef.current++
          const now = Date.now()
          if (now - lastTimeRef.current >= 1000) {
            setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)))
            frameCountRef.current = 0
            lastTimeRef.current = now
          }
          
        } catch (error) {
          console.error('Processing error:', error)
        }
      }

      animationRef.current = requestAnimationFrame(processFrame)
    }
    
    // Start processing after a short delay
    const timer = setTimeout(() => {
      processFrame()
    }, 100)
    
    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [stream])

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-800 border-b border-gray-600 flex justify-between items-center">
        <p className="text-xs text-gray-300">{status}</p>
        <p className="text-xs text-gray-300">FPS: {fps}</p>
      </div>
      
      <div className="flex-1 flex bg-black relative">
        {/* Split view: Camera on left, Depth on right */}
        <div className="flex-1 flex">
          {/* Camera feed */}
          <div className="flex-1 relative">
            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline 
              autoPlay 
              muted
              onLoadedMetadata={() => console.log('Video metadata loaded')}
              onCanPlay={() => console.log('Video can play')}
              onError={(e) => console.error('Video error:', e)}
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              RGB Camera
            </div>
          </div>
          
          {/* Depth map */}
          <div className="flex-1 relative">
            <canvas 
              ref={depthCanvasRef}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Depth Map
            </div>
            {centroidData && (
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                Centroid: ({centroidData.x}, {centroidData.y})<br/>
                Area: {centroidData.area}px
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-2 bg-blue-900 border-t border-blue-700">
        <p className="text-xs text-blue-200">
          <strong>Depth Estimation:</strong> Real-time obstacle detection & centroid tracking
        </p>
      </div>
    </div>
  )
}

export default DepthEstimationView
