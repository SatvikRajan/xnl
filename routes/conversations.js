const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'username profilePicture') 
      .populate('lastMessage') 
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/direct', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const currentUser = req.user;

   
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    
    const existingConversation = await Conversation.findOne({
      type: 'direct',
      participants: { $all: [currentUser._id, targetUser._id] }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

   
    const conversation = new Conversation({
      participants: [currentUser._id, targetUser._id],
      type: 'direct'
    });

    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post('/group', auth, async (req, res) => {
  try {
    const { emails, groupName } = req.body;
    const participants = [req.user._id];

    
    const users = await User.find({ email: { $in: emails } });
    participants.push(...users.map(u => u._id));

    const conversation = new Conversation({
      participants,
      type: 'group',
      groupName
    });

    await conversation.save();
    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;