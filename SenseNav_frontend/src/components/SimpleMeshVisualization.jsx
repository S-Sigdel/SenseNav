import React, { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'

const SimpleMeshVisualization = () => {
  const [status, setStatus] = useState('Initializing...')
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const meshRef = useRef(null)
  const animationRef = useRef(null)

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
      
      // Create a mesh that will be updated based on camera processing
      const geometry = new THREE.PlaneGeometry(4, 3, 64, 48)
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
      
      setStatus('3D scene ready')
    }

    initThreeJS()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
      }
    }
  }, [])

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
        }
        setStatus('Camera active - 3D mesh ready')
        
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

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (!meshRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const time = Date.now() * 0.001
      const geometry = meshRef.current.geometry
      const positions = geometry.attributes.position.array
      
      // Create animated wave effect that responds to time
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i]
        const y = positions[i + 1]
        
        // Create wave effect
        const wave = Math.sin(x * 3 + time * 2) * Math.cos(y * 3 + time * 1.5) * 0.3
        positions[i + 2] = wave
      }
      
      geometry.attributes.position.needsUpdate = true
      
      // Rotate the mesh
      meshRef.current.rotation.x = time * 0.2
      meshRef.current.rotation.y = time * 0.3
      
      // Change color over time
      const hue = (Math.sin(time * 0.5) + 1) * 0.5 * 0.3 + 0.3 // Green to yellow range
      meshRef.current.material.color.setHSL(hue, 1, 0.5)

      rendererRef.current.render(sceneRef.current, cameraRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    // Start animation after a short delay to ensure everything is initialized
    const timer = setTimeout(() => {
      animate()
    }, 100)
    
    return () => {
      clearTimeout(timer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

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
          <strong>3D Mesh:</strong> Animated wireframe visualization
        </p>
      </div>
    </div>
  )
}

export default SimpleMeshVisualization
