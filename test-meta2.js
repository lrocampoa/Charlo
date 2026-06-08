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

async function checkCompany() {
  const snapshot = await db.collection('companies').limit(1).get();
  const company = snapshot.docs[0].data();
  console.log("whatsappPhoneNumberId:", company.whatsappPhoneNumberId);
  console.log("whatsappBusinessAccountId:", company.whatsappBusinessAccountId);
  console.log("testPhoneNumber:", company.testPhoneNumber);
}

checkCompany().catch(console.error);
