import React, { useState, useEffect, useRef } from 'react'

const WebRTCCamera = ({ role = 'view', room = 'demo' }) => {
  const [status, setStatus] = useState('Starting…')
  const [ws, setWs] = useState(null)
  const [pc, setPc] = useState(null)
  const [localStream, setLocalStream] = useState(null)
  const [connectionState, setConnectionState] = useState('disconnected')
  const videoRef = useRef(null)

  useEffect(() => {
    const initializeWebRTC = async () => {
      try {
        // Use LAN IP for both Vite (this page) and signaling
        const signalingURL = `wss://${window.location.hostname}:7443`
        const websocket = new WebSocket(signalingURL)
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
        })

        setWs(websocket)
        setPc(peerConnection)

        websocket.addEventListener('open', () => {
          websocket.send(JSON.stringify({ type: 'join', room }))
          setStatus('Connected to signaling')
        })

        websocket.addEventListener('message', async (ev) => {
          try {
            // Handle both text and blob messages
            let data = ev.data
            if (data instanceof Blob) {
              data = await data.text()
            }
            const msg = JSON.parse(data)
            
            if (msg.type === 'offer' && role === 'view' && connectionState === 'disconnected') {
              setConnectionState('connecting')
              await peerConnection.setRemoteDescription(msg.sdp)
              const answer = await peerConnection.createAnswer()
              await peerConnection.setLocalDescription(answer)
              websocket.send(JSON.stringify({ type: 'answer', sdp: peerConnection.localDescription, room }))
              setStatus('Answer sent, waiting for connection...')
            } else if (msg.type === 'answer' && role === 'pub' && connectionState === 'connecting') {
              await peerConnection.setRemoteDescription(msg.sdp)
              setConnectionState('connected')
              setStatus('Connected!')
            } else if (msg.type === 'ice') {
              try { 
                await peerConnection.addIceCandidate(msg.candidate) 
              } catch (e) {
                console.warn('Failed to add ICE candidate:', e)
              }
            }
          } catch (error) {
            console.warn('Failed to parse WebSocket message:', error)
          }
        })

        peerConnection.onicecandidate = (e) => {
          if (e.candidate) {
            websocket.send(JSON.stringify({ type: 'ice', candidate: e.candidate, room }))
          }
        }

        peerConnection.ontrack = (e) => {
          if (videoRef.current) {
            videoRef.current.srcObject = e.streams[0]
            setStatus('Receiving stream')
            setConnectionState('connected')
          }
        }

        peerConnection.onconnectionstatechange = () => {
          console.log('Connection state:', peerConnection.connectionState)
          if (peerConnection.connectionState === 'connected') {
            setStatus('Connected!')
            setConnectionState('connected')
          } else if (peerConnection.connectionState === 'failed') {
            setStatus('Connection failed')
            setConnectionState('disconnected')
          }
        }

        if (role === 'pub') {
          // Publisher: iPhone will open this and capture camera+mic
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' }, 
              audio: true
            })
            setLocalStream(stream)
            stream.getTracks().forEach(track => peerConnection.addTrack(track, stream))
            
            if (videoRef.current) {
              videoRef.current.srcObject = stream // local preview
            }
            
            setStatus('Got local media; creating offer...')
            setConnectionState('connecting')
            const offer = await peerConnection.createOffer({ offerToReceiveVideo: false })
            await peerConnection.setLocalDescription(offer)
            websocket.send(JSON.stringify({ type: 'offer', sdp: peerConnection.localDescription, room }))
            setStatus('Offer sent, waiting for answer...')
          } catch (err) {
            setStatus('getUserMedia failed: ' + err.message)
            console.error(err)
          }
        } else {
          // Viewer: just wait for offer -> answer
          setStatus('Viewer waiting for offer…')
        }

      } catch (error) {
        console.error('WebRTC initialization failed:', error)
        setStatus('Initialization failed: ' + error.message)
      }
    }

    initializeWebRTC()

    // Cleanup function
    return () => {
      if (ws) {
        ws.close()
      }
      if (pc) {
        pc.close()
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [role, room])

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
          muted={role === 'pub'}
        />
      </div>
      
      {role === 'pub' && (
        <div className="p-2 bg-yellow-900 border-t border-yellow-700">
          <p className="text-xs text-yellow-200">
            <strong>Publisher:</strong> Allow camera/mic permissions
          </p>
        </div>
      )}
      
      {role === 'view' && (
        <div className="p-2 bg-blue-900 border-t border-blue-700">
          <p className="text-xs text-blue-200">
            <strong>Viewer:</strong> Waiting for stream
          </p>
        </div>
      )}
    </div>
  )
}

export default WebRTCCamera
