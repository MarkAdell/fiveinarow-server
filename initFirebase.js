const admin = require('firebase-admin');
require('dotenv').config();

module.exports = () => {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.PROJECT_ID,
      clientEmail: process.env.CLIENT_EMAIL,
      privateKey: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.DATABASEURL,
    databaseAuthVariableOverride: {
      uid: process.env.DATABASE_AUTH_VARIABLE_OVERRIDE,
    }
  });
};
