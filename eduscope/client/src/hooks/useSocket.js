// === FILE: client/src/hooks/useSocket.js ===
import { useEffect, useRef } from 'react';
import { getSocket } from '../socket';

export function useSocketEvents(events) {
  const saved = useRef(events);
  saved.current = events;
  useEffect(() => {
    const socket = getSocket();
    const map = {};
    Object.keys(saved.current || {}).forEach((evt) => {
      const h = (p) => { const fn = saved.current[evt]; if (fn) fn(p); };
      map[evt] = h;
      socket.on(evt, h);
    });
    return () => { Object.entries(map).forEach(([e, h]) => socket.off(e, h)); };
  }, []);
}

export function useSessionRoom(sessionId) {
  useEffect(() => {
    if (!sessionId) return;
    const socket = getSocket();
    const join = () => socket.emit('join:session', { sessionId });
    if (socket.connected) join();
    socket.on('connect', join);
    return () => { socket.emit('leave:session', { sessionId }); socket.off('connect', join); };
  }, [sessionId]);
}

export function emitSocket(event, payload) {
  getSocket().emit(event, payload);
}
