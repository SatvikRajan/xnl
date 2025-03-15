// sockets/index.js
const jwt = require('jsonwebtoken');

const socketHandlers = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log('Token:', token);

    jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err);
        return next(new Error('Authentication error'));
      }

      console.log('Decoded user:', decoded);
      socket.userId = decoded.userId;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    });

    socket.on('markMessagesAsSeen', require('./handlers/markMessagesAsSeen')(socket, io)); // Pass io

    socket.on('sendMessage', require('./handlers/sendMessage')(socket, io)); // Pass io

    socket.on('createDirectConversation', require('./handlers/createDirectConversation')(socket, io)); // Pass io

    socket.on('createGroupConversation', require('./handlers/createGroupConversation')(socket, io)); // Pass io

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });

    const userId = socket.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });
};

module.exports = socketHandlers;