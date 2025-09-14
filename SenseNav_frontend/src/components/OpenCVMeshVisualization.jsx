import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

const OpenCVMeshVisualization = () => {
  const [status, setStatus] = useState('Loading OpenCV...')
  const [stream, setStream] = useState(null)
  const [opencvReady, setOpencvReady] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)
  const animationRef = useRef(null)

  // Load OpenCV.js
  useEffect(() => {
    const loadOpenCV = () => {
      if (window.cv) {
        setOpencvReady(true)
        setStatus('OpenCV loaded - initializing camera...')
        return
      }

      const script = document.createElement('script')
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js'
      script.async = true
      script.onload = () => {
        window.cv.onRuntimeInitialized = () => {
          setOpencvReady(true)
          setStatus('OpenCV loaded - initializing camera...')
        }
      }
      document.head.appendChild(script)
    }

    loadOpenCV()
  }, [])

  useEffect(() => {
    const initThreeJS = () => {
      if (!canvasRef.current) return

      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x000000)
      
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
      camera.position.z = 5
      
      const renderer = new THREE.WebGLRenderer({ 
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      })
      renderer.setSize(256, 256)
      renderer.setPixelRatio(window.devicePixelRatio)
      
      // Create a mesh that will be updated based on OpenCV processing
      const geometry = new THREE.PlaneGeometry(4, 3, 64, 48) // Higher resolution for better detail
      const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      })
      
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      
      // Store references
      sceneRef.current = scene
      rendererRef.current = renderer
      cameraRef.current = camera
      meshRef.current = mesh
    }

    if (opencvReady) {
      initThreeJS()
    }
  }, [opencvReady])

  useEffect(() => {
    const startCamera = async () => {
      if (!opencvReady) return

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
        }
        setStatus('Camera active - processing with OpenCV...')
        
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
  }, [opencvReady])

  // OpenCV processing and animation loop
  useEffect(() => {
    if (!opencvReady || !stream) return

    const processFrame = () => {
      if (!meshRef.current || !videoRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationRef.current = requestAnimationFrame(processFrame)
        return
      }

      const video = videoRef.current
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        try {
          // Create canvas for OpenCV processing
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0)
          
          // Get image data from canvas
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          
          // Create OpenCV Mat from image data
          const src = window.cv.matFromImageData(imageData)
          const gray = new window.cv.Mat()
          const edges = new window.cv.Mat()
          const heightMap = new window.cv.Mat()
          
          // Convert to grayscale
          window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY)
          
          // Apply Gaussian blur
          window.cv.GaussianBlur(gray, gray, new window.cv.Size(5, 5), 0)
          
          // Edge detection
          window.cv.Canny(gray, edges, 50, 150)
          
          // Create height map from edges
          window.cv.GaussianBlur(edges, heightMap, new window.cv.Size(15, 15), 0)
          
          // Update 3D mesh based on height map
          const geometry = meshRef.current.geometry
          const positions = geometry.attributes.position.array
          
          const width = heightMap.cols
          const height = heightMap.rows
          
          // Get height map data safely
          const heightData = new Uint8Array(heightMap.data)
          
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]
            const y = positions[i + 1]
            
            // Map 3D coordinates to image coordinates
            const imgX = Math.floor((x + 2) / 4 * width)
            const imgY = Math.floor((y + 1.5) / 3 * height)
            
            if (imgX >= 0 && imgX < width && imgY >= 0 && imgY < height) {
              const pixelIndex = imgY * width + imgX
              const intensity = heightData[pixelIndex] / 255.0
              
              // Use intensity to create height variation
              positions[i + 2] = intensity * 0.5
            } else {
              positions[i + 2] = 0
            }
          }
          
          geometry.attributes.position.needsUpdate = true
          
          // Rotate mesh slowly
          const time = Date.now() * 0.001
          meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1
          meshRef.current.rotation.y = time * 0.05
          
          // Change color based on average intensity
          const meanIntensity = window.cv.mean(heightMap)[0] / 255
          const hue = meanIntensity * 0.3 + 0.3 // Green to yellow
          meshRef.current.material.color.setHSL(hue, 1, 0.5)
          
          // Clean up OpenCV Mats
          src.delete()
          gray.delete()
          edges.delete()
          heightMap.delete()
          
        } catch (error) {
          console.error('OpenCV processing error:', error)
          // Fallback to simple animation if OpenCV fails
          const time = Date.now() * 0.001
          const geometry = meshRef.current.geometry
          const positions = geometry.attributes.position.array
          
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]
            const y = positions[i + 1]
            const wave = Math.sin(x * 3 + time * 2) * Math.cos(y * 3 + time * 1.5) * 0.3
            positions[i + 2] = wave
          }
          
          geometry.attributes.position.needsUpdate = true
          meshRef.current.rotation.x = Math.sin(time * 0.1) * 0.1
          meshRef.current.rotation.y = time * 0.05
        }
      }

      rendererRef.current.render(sceneRef.current, cameraRef.current)
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
  }, [opencvReady, stream])

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-800 border-b border-gray-600">
        <p className="text-xs text-gray-300">{status}</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-black relative">
        {/* Hidden video element for processing */}
        <video 
          ref={videoRef}
          className="hidden"
          playsInline 
          autoPlay 
          muted
        />
        
        {/* 3D Canvas */}
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          style={{ background: 'transparent' }}
        />
      </div>
      
      <div className="p-2 bg-purple-900 border-t border-purple-700">
        <p className="text-xs text-purple-200">
          <strong>OpenCV Mesh:</strong> Real-time edge detection & 3D mapping
        </p>
      </div>
    </div>
  )
}

export default OpenCVMeshVisualization
