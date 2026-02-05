import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  },
  connectionStateRecovery: {}
});

// Store rooms data
const rooms = new Map();
const users = new Map();

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Handle joining a room
  socket.on('join-room', ({ roomId, username, color }) => {
    console.log(`👤 ${username} (${socket.id}) joining room ${roomId}`);
    
    // Leave any previous rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    socket.join(roomId);
    
    // Initialize room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        drawings: [],
        users: new Map(),
        chat: []
      });
      console.log(`📝 Created new room: ${roomId}`);
    }
    
    const room = rooms.get(roomId);
    
    // Add user to room
    const userData = {
      id: socket.id,
      username: username || `User${socket.id.substring(0, 4)}`,
      color: color || '#007AFF',
      joinedAt: new Date(),
      cursor: { x: 0, y: 0 }
    };
    
    room.users.set(socket.id, userData);
    users.set(socket.id, { roomId, username: userData.username, color: userData.color });
    
    // Send room data to new user
    socket.emit('room-data', {
      drawings: room.drawings,
      users: Array.from(room.users.values()),
      chat: room.chat.slice(-50)
    });
    
    // Notify others in room (EXCLUDE sender)
    socket.to(roomId).emit('user-joined', userData);
    
    // Broadcast updated user list to ALL in room (INCLUDE sender)
    io.to(roomId).emit('users-updated', Array.from(room.users.values()));
    
    console.log(`✅ ${userData.username} joined room ${roomId}. Total users: ${room.users.size}`);
  });

  // Handle drawing - FIXED: Works for all tools
  socket.on('draw', ({ roomId, points, color, brushSize, tool }) => {
    console.log(`🎨 Drawing in ${roomId}: ${tool} with ${points.length} points`);
    
    const room = rooms.get(roomId);
    if (!room) {
      console.error(`❌ Room ${roomId} not found`);
      return;
    }
    
    const drawing = {
      id: Date.now().toString(),
      points: Array.isArray(points) ? points : [points],
      color: color || '#000000',
      brushSize: brushSize || 5,
      tool: tool || 'pencil',
      userId: socket.id,
      timestamp: new Date()
    };
    
    room.drawings.push(drawing);
    
    // Broadcast to everyone in room INCLUDING sender for immediate feedback
    io.to(roomId).emit('drawing', drawing);
  });

  // Handle clearing canvas
  socket.on('clear-canvas', (roomId) => {
    const room = rooms.get(roomId);
    if (room) {
      room.drawings = [];
      io.to(roomId).emit('canvas-cleared');
      console.log(`🧹 Canvas cleared in room ${roomId}`);
    }
  });

  // Handle undo
  socket.on('undo', (roomId) => {
    const room = rooms.get(roomId);
    if (room && room.drawings.length > 0) {
      room.drawings.pop();
      io.to(roomId).emit('undone');
      console.log(`↩️ Undo in room ${roomId}`);
    }
  });

  // Handle cursor movement
  socket.on('cursor-move', ({ roomId, x, y }) => {
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.get(socket.id);
      if (user) {
        user.cursor = { x, y };
        socket.to(roomId).emit('cursor-updated', {
          userId: socket.id,
          cursor: { x, y }
        });
      }
    }
  });

  // Handle chat messages - FIXED
  socket.on('send-message', ({ roomId, message }) => {
    console.log(`💬 Chat in ${roomId}: "${message}"`);
    
    const user = users.get(socket.id);
    if (!user) {
      console.error('❌ User not found for chat');
      return;
    }
    
    const chatMessage = {
      id: Date.now().toString(),
      userId: socket.id,
      username: user.username,
      color: user.color,
      message: message,
      timestamp: new Date()
    };
    
    const room = rooms.get(roomId);
    if (room) {
      room.chat.push(chatMessage);
      // Broadcast to ALL users in the room (INCLUDING sender)
      io.to(roomId).emit('new-message', chatMessage);
      console.log(`✅ Message sent by ${user.username} in ${roomId}`);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
    
    const user = users.get(socket.id);
    if (user) {
      const { roomId } = user;
      const room = rooms.get(roomId);
      
      if (room) {
        room.users.delete(socket.id);
        
        // Notify others in the room
        socket.to(roomId).emit('user-left', socket.id);
        io.to(roomId).emit('users-updated', Array.from(room.users.values()));
        
        console.log(`👤 ${user.username} left room ${roomId}. Remaining: ${room.users.size}`);
        
        // Remove room if empty
        if (room.users.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️ Room ${roomId} deleted (no users)`);
        }
      }
      
      users.delete(socket.id);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('✅ Ready for connections...');
});