// Simple script to get your LAN IP
import os from 'os';

function getLANIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const i of ifaces[name]) {
      if (i.family === 'IPv4' && !i.internal) {
        return i.address;
      }
    }
  }
  return '127.0.0.1';
}

console.log('Your LAN IP is:', getLANIP());
console.log('Vite will be available at: https://' + getLANIP() + ':5173');
console.log('Signaling server will be at: wss://' + getLANIP() + ':7443');
