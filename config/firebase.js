// config/firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('../booksy-3f967-firebase-adminsdk-uhv4s-18dd11bd2d.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;