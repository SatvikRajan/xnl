const jwt = require('jsonwebtoken');
const User = require('../models/User'); 

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    console.log('Token:', token); 

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    console.log('Decoded Token:', decoded); 

    const user = await User.findOne({
      _id: decoded.userId,
      'tokens.token': token
    });

    if (!user) {
      console.log('User not found or token not in tokens array');
      throw new Error('Invalid token');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.log('Auth Error:', error.message); // Log the error
    res.status(401).json({ message: 'Please authenticate', error: error.message });
  }
};  

module.exports = auth;