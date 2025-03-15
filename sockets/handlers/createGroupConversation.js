const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const admin = require('../../config/firebase');

module.exports = (socket) => async (data) => {
  try {
    const { emails, groupName } = data;
    const participants = [socket.userId]; 

    const users = await User.find({ email: { $in: emails } });
    participants.push(...users.map(u => u._id));

    const conversation = new Conversation({
      participants,
      type: 'group',
      groupName
    });

    await conversation.save();

    participants.forEach(async (participantId) => {
      const participant = await User.findById(participantId);

      socket.emit('conversationCreated', conversation);
      socket.to(`user_${participantId}`).emit('conversationCreated', conversation);

      socket.emit('refreshHomeScreen');
      socket.to(`user_${participantId}`).emit('refreshHomeScreen');

      if (participant.fcmToken) {
        const notification = {
          notification: {
            title: 'New Group Conversation',
            body: `You were added to the group "${groupName}".`,
          },
          token: participant.fcmToken,
        };

        await admin.messaging().send(notification);
        console.log(`Notification sent to ${participant.email}`);
      }
    });

  } catch (error) {
    socket.emit('error', { message: 'Failed to create group conversation', error: error.message });
  }
};