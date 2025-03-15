const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const User = require('../models/User');

router.get('/me', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .select('-password -tokens')
        .populate('contacts.user', 'username profilePicture');
  
      res.json({
        ...user.toObject(),
        contactCount: user.contacts.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.put('/me', auth, async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = [
      'username',
      'profile.bio',
      'profile.location',
      'profile.website'
    ];
  
    const isValidOperation = updates.every(update => 
      allowedUpdates.includes(update)
    );
  
    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid updates!' });
    }
  
    try {
      updates.forEach(update => 
        req.user[update] = req.body[update]
      );
      
      await req.user.save();
      res.json(req.user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

module.exports = router;