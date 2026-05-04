// === FILE: client/src/socket/index.js ===
import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    // In dev, Vite proxies /socket.io → localhost:4000, so no explicit URL needed.
    // In production, set VITE_API_URL to the backend origin.
    const url = import.meta.env.VITE_API_URL || undefined;
    socket = io(url, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => console.log('[socket] connected:', socket.id));
    socket.on('connect_error', (err) => console.error('[socket] connection error:', err.message));
    socket.on('disconnect', (reason) => console.log('[socket] disconnected:', reason));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}
