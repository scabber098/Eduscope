// === FILE: server/socket/index.js ===
let io = null;

function initSocket(server, options = {}) {
  const { Server } = require('socket.io');
  io = new Server(server, {
    cors: { origin: options.clientOrigin || '*', methods: ['GET','POST'], credentials: true },
  });

  io.on('connection', (socket) => {
    console.log('[socket] connected:', socket.id);

    socket.on('join:session', ({ sessionId }) => {
      if (!sessionId) return;
      socket.join(`session:${sessionId}`);
      // broadcast updated presence count
      const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('presence:count', { sessionId, count: room ? room.size : 0 });
    });

    socket.on('leave:session', ({ sessionId }) => {
      if (!sessionId) return;
      socket.leave(`session:${sessionId}`);
      const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('presence:count', { sessionId, count: room ? room.size : 0 });
    });

    socket.on('join:lecture', ({ lectureId }) => {
      if (!lectureId) return;
      socket.join(`lecture:${lectureId}`);
    });

    socket.on('leave:lecture', ({ lectureId }) => {
      if (!lectureId) return;
      socket.leave(`lecture:${lectureId}`);
    });

    socket.on('presence:ping', ({ sessionId }) => {
      if (!sessionId) return;
      const room = io.sockets.adapter.rooms.get(`session:${sessionId}`);
      io.to(`session:${sessionId}`).emit('presence:count', { sessionId, count: room ? room.size : 0 });
    });

    socket.on('disconnect', () => {
      console.log('[socket] disconnected:', socket.id);
    });
  });

  return io;
}

function getIO() { return io; }
module.exports = { initSocket, getIO };
