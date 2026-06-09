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

const db = admin.firestore();

async function cleanup() {
  const sessionsSnap = await db.collection('sessions').get();
  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    if (data.sessionId && data.sessionId.startsWith(data.companyId + '_')) {
      console.log('Found duplicate session:', doc.id);
      
      // Delete all messages inside
      const messagesSnap = await doc.ref.collection('messages').get();
      for (const mDoc of messagesSnap.docs) {
        await mDoc.ref.delete();
      }
      
      // Delete the session
      await doc.ref.delete();
      console.log('Deleted duplicate session.');
    }
  }
}

cleanup().catch(console.error);
