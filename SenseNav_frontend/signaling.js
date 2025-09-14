// signaling.js
import { WebSocketServer } from 'ws'
import { createServer } from 'https'
import { readFileSync } from 'fs'

// Reuse the same cert so iPhone accepts wss://
const server = createServer({
  key: readFileSync('./localhost+3-key.pem'),
  cert: readFileSync('./localhost+3.pem'),
})

const wss = new WebSocketServer({ server })
const rooms = new Map() // roomId -> Set<WebSocket>

function joinRoom(ws, room) {
  if (!rooms.has(room)) rooms.set(room, new Set())
  rooms.get(room).add(ws)
  ws.on('close', () => rooms.get(room)?.delete(ws))
}

wss.on('connection', (ws) => {
  console.log('New WebSocket connection')
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg)
      console.log('Received message:', data.type, 'in room:', data.room)
      if (data.type === 'join') {
        ws.room = data.room
        joinRoom(ws, data.room)
        console.log('Client joined room:', data.room)
        return
      }
      // relay to everyone else in the same room
      const peers = rooms.get(ws.room || '')
      if (!peers) return
      console.log('Relaying', data.type, 'to', peers.size - 1, 'peers')
      for (const p of peers) if (p !== ws && p.readyState === 1) p.send(msg)
    } catch (e) {
      console.error('Error parsing message:', e)
    }
  })
})

const PORT = 7443
server.listen(PORT, () => console.log(`🔔 Signaling wss://<LAN-IP>:${PORT}`))
s 