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

async function testCRM() {
  const companyId = 'b049b1ca-c827-46e3-aeab-cb8f0dc44e8c'; // Pallets.cr maybe? Let's fetch the first company
  const snapshot = await db.collection('companies').limit(1).get();
  const id = snapshot.docs[0].id;
  
  console.log("Fetching customers for company:", id);

  const dbCustomersSnap = await db.collection('customers').where('companyId', '==', id).get();
  console.log("dbCustomers:", dbCustomersSnap.size);

  const sessionsSnap = await db.collection('sessions').where('companyId', '==', id).get();
  console.log("sessions:", sessionsSnap.size);
  
  const ordersSnap = await db.collection('companies').doc(id).collection('orders').get();
  console.log("orders:", ordersSnap.size);

  const resSnap = await db.collection('companies').doc(id).collection('reservations').get();
  console.log("reservations:", resSnap.size);

  // Let's see if one of them fails
}

testCRM().catch(console.error);
