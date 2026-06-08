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
  if (snapshot.empty) {
    console.log("No companies found.");
    return;
  }
  const company = snapshot.docs[0].data();
  console.log("Company:", company.name);
  console.log("WhatsApp Phone ID:", company.whatsappPhoneNumberId);
  console.log("Meta Access Token:", company.metaAccessToken ? "EXISTS" : "MISSING");
  
  const accessToken = company.metaAccessToken;
  const businessPhoneId = company.whatsappPhoneNumberId;
  const senderPhone = "50683039267";

  const res = await fetch(`https://graph.facebook.com/v19.0/${businessPhoneId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: senderPhone,
      text: { body: "Prueba desde script local" }
    })
  });
  
  const fetchData = await res.json();
  console.log("Meta API Response:", JSON.stringify(fetchData, null, 2));
}

testMetaAPI().catch(console.error);
