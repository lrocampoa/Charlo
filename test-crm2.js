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

async function GET() {
  try {
    const id = 'company_1780721661003_draft';

    const dbCustomersSnap = await db.collection('customers').where('companyId', '==', id).get();
    const dbCustomers = dbCustomersSnap.docs.map(doc => doc.data());

    const sessionsSnap = await db.collection('sessions').where('companyId', '==', id).get();
    const sessions = sessionsSnap.docs.map(doc => doc.data());
    
    const customersMap = {};
    for (const c of dbCustomers) {
      customersMap[c.customerId] = { ...c };
    }

    for (const s of sessions) {
      const customerId = s.sessionId;
      if (!customersMap[customerId]) {
        customersMap[customerId] = {
          companyId: id,
          customerId,
          extractedFacts: {},
          createdAt: s.lastUpdated || new Date(s.updatedAt || Date.now()).toISOString()
        };
      }
      customersMap[customerId].lastInteractionAt = s.lastUpdated || new Date(s.updatedAt || Date.now()).toISOString();
    }

    const allCustomers = Object.values(customersMap);

    const ordersSnapshot = await db.collection('companies').doc(id).collection('orders').get();
    const reservationsSnapshot = await db.collection('companies').doc(id).collection('reservations').get();
    
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const reservations = reservationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const ordersByCustomer = {};
    for (const order of orders) {
      if (!ordersByCustomer[order.customerId]) {
        ordersByCustomer[order.customerId] = [];
      }
      ordersByCustomer[order.customerId].push(order);
    }

    const reservationsByCustomer = {};
    for (const reservation of reservations) {
      if (!reservationsByCustomer[reservation.customerId]) {
        reservationsByCustomer[reservation.customerId] = [];
      }
      reservationsByCustomer[reservation.customerId].push(reservation);
    }

    const enrichedCustomers = allCustomers.map(customer => {
      const customerOrders = ordersByCustomer[customer.customerId] || [];
      const customerReservations = reservationsByCustomer[customer.customerId] || [];
      
      const lifetimeValue = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

      return {
        ...customer,
        orders: customerOrders,
        reservations: customerReservations,
        lifetimeValue
      };
    });

    enrichedCustomers.sort((a, b) => {
      const dateA = new Date(a.lastInteractionAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.lastInteractionAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    console.log(JSON.stringify({ customers: enrichedCustomers }, null, 2));
  } catch (error) {
    console.error("Error fetching customers:", error);
  }
}

GET();
