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

async function testMetaAPI() {
  const snapshot = await db.collection('companies').limit(1).get();
  const company = snapshot.docs[0].data();
  const accessToken = company.metaAccessToken;
  const businessPhoneId = company.whatsappPhoneNumberId;

  // Test 1: Fetch Phone Number Info
  console.log("Fetching Phone Number Info for", businessPhoneId);
  const res1 = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  console.log("Res1:", await res1.json());

  // Test 2: Debug Token
  console.log("Debugging Token");
  const res2 = await fetch(`https://graph.facebook.com/v19.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`, {
    method: 'GET'
  });
  console.log("Res2:", await res2.json());
}

testMetaAPI().catch(console.error);
