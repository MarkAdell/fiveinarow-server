const admin = require('firebase-admin');
require('dotenv').config();

module.exports = () => {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: process.env.DATABASEURL
  });
};
