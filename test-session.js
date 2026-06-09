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

async function check() {
  const snap = await db.collection('sessions').where('companyId', '==', 'company_1780721661003_draft').get();
  snap.forEach(doc => {
    console.log(doc.id, "=> customerName:", doc.data().customerName, "lastMessage:", doc.data().lastMessage);
  });
}
check();
