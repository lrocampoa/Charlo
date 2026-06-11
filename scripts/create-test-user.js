require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

async function createTestUser() {
  const email = 'test@charlo.io';
  const password = 'Password123!';
  
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      emailVerified: true,
      password: password,
      displayName: 'Meta Reviewer',
      disabled: false,
    });
    console.log('Successfully created new user:', userRecord.uid);
    
    // Create a user document in Firestore just in case the app expects it
    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      email: email,
      name: 'Meta Reviewer',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'owner', // Give them owner permissions so they don't get stuck
    });
    console.log('User document created in Firestore.');
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log('Test user already exists! You can use email:', email, 'and password:', password);
      // Let's reset the password just in case
      try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().updateUser(user.uid, { password: password });
        console.log('Reset password for existing test user.');
      } catch (e) {
        console.error('Error resetting password:', e);
      }
    } else {
      console.error('Error creating new user:', error);
    }
  }
}

createTestUser().then(() => process.exit(0));
