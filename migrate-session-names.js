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

async function runMigration() {
  const sessionsSnap = await db.collection('sessions').get();
  let count = 0;
  
  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    if (!data.customerName) {
      // try to find customer profile
      const customerSnap = await db.collection('customers')
        .where('companyId', '==', data.companyId)
        .where('customerId', '==', data.sessionId)
        .get();
        
      if (!customerSnap.empty) {
        const customerData = customerSnap.docs[0].data();
        if (customerData.extractedFacts && customerData.extractedFacts.name) {
          await doc.ref.update({ customerName: customerData.extractedFacts.name });
          console.log(`Updated session ${doc.id} with name ${customerData.extractedFacts.name}`);
          count++;
          continue;
        }
      }
      
      // If not in customers, try to extract from history or messages if possible
      const messagesSnap = await doc.ref.collection('messages').orderBy('timestamp', 'asc').get();
      let foundName = null;
      for (const mDoc of messagesSnap.docs) {
        const mData = mDoc.data();
        const text = mData.parts?.[0]?.text || '';
        const match = text.match(/\\[Meta Profile Name: (.*?)\\]/);
        if (match && match[1]) {
          foundName = match[1];
          break;
        }
      }
      if (foundName) {
        await doc.ref.update({ customerName: foundName });
        console.log(`Updated session ${doc.id} with name ${foundName} (from message text)`);
        count++;
      }
    }
  }
  
  console.log(`Migration complete. Updated ${count} sessions.`);
}

runMigration().catch(console.error);
