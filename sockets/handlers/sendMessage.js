const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const User = require('../../models/User');
const admin = require('../../config/firebase');

module.exports = (socket, io) => async (messageData) => {
  try {
    const { conversation, content, sender } = messageData;


    const message = new Message({
      conversation,
      content,
      sender,
      status: 'sent' 
    });
    await message.save();

    await Conversation.findByIdAndUpdate(conversation, {
      lastMessage: message._id
    });

    io.to(conversation).emit('newMessage', message); 
    console.log(`Message sent to conversation ${conversation}:`, message);

    message.status = 'delivered';
    await message.save();
    io.to(conversation).emit('statusUpdate', message); 

    const conversationDoc = await Conversation.findById(conversation).populate('participants');
    const participants = conversationDoc.participants;

    participants.forEach(async (participant) => {
      if (participant._id.toString() !== sender) {
        if (participant.fcmToken) {
          const notification = {
            notification: {
              title: 'New Message',
              body: content,
            },
            token: participant.fcmToken,
          };

          await admin.messaging().send(notification);
          console.log(`Notification sent to ${participant.email}`);
        }
      }
    });

  } catch (error) {
    console.error('Message send error:', error);
    socket.emit('error', { message: 'Failed to send message', error: error.message });
  }
};