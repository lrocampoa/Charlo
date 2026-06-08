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

async function runCurl() {
  const snapshot = await db.collection('companies').limit(1).get();
  const company = snapshot.docs[0].data();
  const token = company.metaAccessToken;
  const phoneId = company.whatsappPhoneNumberId;
  const to = "50683039267";

  console.log("Token prefix:", token.substring(0, 15) + "...");
  console.log("Token length:", token.length);
  
  const res = await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" }
      }
    })
  });
  
  console.log("Status v25.0:", res.status);
  console.log("Response v25.0:", await res.json());
}

runCurl().catch(console.error);
