const Message = require('../../models/Message');

module.exports = (socket, io) => async (conversationId) => {
  try {
    const userId = socket.userId;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId },
        status: { $ne: 'seen' }
      },
      { status: 'seen' }
    );

    io.to(conversationId).emit('messagesSeen', { 
      conversationId,
      seenBy: userId
    });

  } catch (error) {
    console.error('Error marking messages as seen:', error);
    socket.emit('error', { message: 'Failed to mark messages as seen', error: error.message });
  }
};