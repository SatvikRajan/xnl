const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const admin = require('../../config/firebase');

module.exports = (socket) => async (data) => {
  try {
    const { targetEmail } = data;
    const currentUser = await User.findById(socket.userId);

    if (!currentUser) {
      return socket.emit('error', { message: 'Current user not found' });
    }

    const targetUser = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      return socket.emit('error', { message: 'User not found' });
    }

    const existingConversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [currentUser._id, targetUser._id] }
    });

    if (existingConversation) {
      return socket.emit('conversationCreated', existingConversation);
    }

    const conversation = new Conversation({
      participants: [currentUser._id, targetUser._id],
      type: 'direct'
    });

    await conversation.save();

    socket.emit('conversationCreated', conversation);
    socket.to(`user_${targetUser._id}`).emit('conversationCreated', conversation);

    socket.emit('refreshHomeScreen');
    socket.to(`user_${targetUser._id}`).emit('refreshHomeScreen');

    if (targetUser.fcmToken) {
      const notification = {
        notification: {
          title: 'New Conversation',
          body: `${currentUser.username} started a conversation with you.`,
        },
        token: targetUser.fcmToken,
      };

      await admin.messaging().send(notification);
      console.log(`Notification sent to ${targetUser.email}`);
    }

  } catch (error) {
    socket.emit('error', { message: 'Failed to create conversation', error: error.message });
  }
};