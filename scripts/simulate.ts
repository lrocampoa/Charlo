import * as admin from 'firebase-admin';

// Initialize Firebase Admin (adjust path to service account if needed, or rely on env vars)
// In Next.js, env vars are loaded by Next, but in a standalone script we might need dotenv
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Setup from admin.ts logic manually for script
let pk = process.env.FIREBASE_PRIVATE_KEY || '';
pk = pk.replace(/["']/g, '');
pk = pk.replace(/\\n/g, '\n').replace(/\\r/g, '').trim();

const pId = (process.env.FIREBASE_PROJECT_ID || '').replace(/["']/g, '').trim();
const cEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').replace(/["']/g, '').trim();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: pId,
      clientEmail: cEmail,
      privateKey: pk,
    }),
  });
}

const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('companies').get();
  if (snapshot.empty) {
    console.log("No companies found.");
    return;
  }
  
  // Pick the first company or find one with a specific number
  const companyDoc = snapshot.docs[0];
  console.log(`Updating company: ${companyDoc.id}`);
  
  await companyDoc.ref.update({
    'subscription.tier': 'starter',
    'subscription.status': 'active',
    'usage.aiMessagesCurrentMonth': 850, // 85% of 1000
    'usage.eightyFivePercentWarningSent': admin.firestore.FieldValue.delete(),
    'testPhoneNumber': '+1234567890' // Make sure we don't accidentally send to real unless they set it. Wait, I should preserve it!
  });
  
  // Revert testPhoneNumber to existing if it exists
  if (companyDoc.data().testPhoneNumber) {
     await companyDoc.ref.update({
       testPhoneNumber: companyDoc.data().testPhoneNumber
     });
     console.log(`Test phone preserved: ${companyDoc.data().testPhoneNumber}`);
  } else {
     console.log("No testPhoneNumber existed. You may need to set one in the UI to get the WhatsApp message.");
  }
  
  console.log("Successfully set usage to 850/1000 (85%) for Starter tier!");
  console.log("Next message from WhatsApp will trigger the warning.");
}

run().catch(console.error);
