import React, { useState, useRef, useEffect } from 'react'

const DirectCameraFeed = () => {
  const [status, setStatus] = useState('Starting...')
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const startCamera = async () => {
      try {
        setStatus('Requesting camera access...')
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        })
        
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
        }
        setStatus('Camera active')
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
    }
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 bg-gray-800 border-b border-gray-600">
        <p className="text-xs text-gray-300">{status}</p>
      </div>
      
      <div className="flex-1 flex items-center justify-center bg-black">
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline 
          autoPlay 
          muted
        />
      </div>
      
      <div className="p-2 bg-green-900 border-t border-green-700">
        <p className="text-xs text-green-200">
          <strong>iPhone Camera:</strong> Wired connection to Mac
        </p>
      </div>
    </div>
  )
}

export default DirectCameraFeed
