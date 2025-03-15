const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');


router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    
    if (!email || !password || !username) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    
    const user = new User({
      email,
      password: hashedPassword,
      username
    });

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } 
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } 
    );
    
    
    user.tokens.push({ token: accessToken });
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
      expiresIn: 900 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' } 
    );
    
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' } 
    );
    
    user.tokens.push({ token: accessToken });
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    res.json({
      success: true,
      accessToken,
      refreshToken,
      userId: user._id,
      expiresIn: 900 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Remove current token from user's tokens
    req.user.tokens = req.user.tokens.filter(
      tokenObj => tokenObj.token !== req.token
    );
    
    await req.user.save();
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
});
router.post('/save-fcm-token', auth, async (req, res) => {
  try {
    const { fcmToken } = req.body;

    // Find the user and update the FCM token
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.fcmToken = fcmToken;
    await user.save();

    res.json({ success: true, message: 'FCM token saved successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save FCM token',
      error: error.message,
    });
  }
});

router.post('/delete-fcm-token', auth, async (req, res) => {
  try {
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

   
    user.fcmToken = undefined;
    await user.save();

    res.json({ 
      success: true, 
      message: 'FCM token removed successfully' 
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove FCM token',
      error: error.message
    });
  }
});


router.post('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token is required' });
  }

  try {
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    
    const user = await User.findOne({
      _id: decoded.userId,
      'tokens.token': refreshToken
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      accessToken,
      expiresIn: 900
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token', error: error.message });
  }
});

module.exports = router;