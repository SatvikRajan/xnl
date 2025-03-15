const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');

router.get('/:conversationId', auth, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const messages = await Message.find({
      conversation: req.params.conversationId
    }).sort({ timestamp: -1 })
      .skip(parseInt(offset)) 
      .limit(parseInt(limit)); 
;
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;  
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    req.app.get('io').to(message.conversation.toString()).emit('statusUpdate', message);
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:conversationId/markAsRead', auth, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: userId }, 
        status: { $ne: 'seen' } 
      },
      { status: 'seen' }
    );

    req.app.get('io').to(conversationId).emit('messagesSeen', {
      conversationId,
      seenBy: userId
    });

    res.json({ success: true, message: 'All messages marked as read' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;