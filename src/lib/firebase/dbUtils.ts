import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';

function getDb() {
  if (!adminDb) throw new Error("Firebase Admin DB is not initialized. Check server credentials.");
  return adminDb;
}

// --- BUSINESS CRUD ---
export async function getCompanies(userId: string) {
  const snapshot = await getDb().collection('companies').where('ownerId', '==', userId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createCompany(companyData: any) {
  const id = `company_${Date.now()}`;
  const newCompany = { id, ...companyData, createdAt: new Date().toISOString() };
  await getDb().collection('companies').doc(id).set(newCompany);
  return newCompany;
}

export async function updateCompany(companyId: string, companyData: any) {
  await getDb().collection('companies').doc(companyId).update({
    ...companyData,
    lastUpdated: new Date().toISOString()
  });
  const doc = await getDb().collection('companies').doc(companyId).get();
  return { id: doc.id, ...doc.data() };
}

export async function deleteCompany(companyId: string) {
  await getDb().collection('companies').doc(companyId).delete();
  return { success: true };
}

// --- COMPANIES (TENANTS) ---
export async function getCompanyConfig(companyId: string) {
  const doc = await getDb().collection('companies').doc(companyId).get();
  return doc.exists ? doc.data() : null;
}

export async function getCompanyByWhatsAppId(phoneId: string) {
  const snapshot = await getDb().collection('companies')
    .where('whatsappPhoneNumberId', '==', phoneId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getCompanyByFacebookPageId(pageId: string) {
  const snapshot = await getDb().collection('companies')
    .where('facebookPageId', '==', pageId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getCompanyByInstagramId(instagramId: string) {
  const snapshot = await getDb().collection('companies')
    .where('instagramAccountId', '==', instagramId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// --- KNOWLEDGE GAPS (QA) ---
export async function saveKnowledgeGap(companyId: string, gapData: any) {
  await getDb().collection('companies').doc(companyId).collection('knowledge_gaps').add({
    ...gapData,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
}

// --- CUSTOMERS (LONG-TERM CRM PROFILES) ---
export async function getCustomersByCompany(companyId: string) {
  const snapshot = await getDb().collection('customers').where('companyId', '==', companyId).get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getCustomerProfile(companyId: string, customerId: string) {
  const docId = `${companyId}_${customerId}`;
  const doc = await getDb().collection('customers').doc(docId).get();
  
  if (!doc.exists) {
    const newProfile = {
      companyId,
      customerId,
      extractedFacts: {},
      createdAt: new Date().toISOString()
    };
    await getDb().collection('customers').doc(docId).set(newProfile);
    return newProfile;
  }
  return doc.data();
}

export async function updateCustomerProfile(companyId: string, customerId: string, newFacts: any) {
  const docId = `${companyId}_${customerId}`;
  await getDb().collection('customers').doc(docId).set({
    extractedFacts: newFacts,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
}

// --- SESSIONS (SHORT-TERM MEMORY) ---
export async function getSessionHistory(companyId: string, sessionId: string) {
  const docId = `${companyId}_${sessionId}`;
  const doc = await getDb().collection('sessions').doc(docId).get();
  
  if (!doc.exists) return [];
  
  const data = doc.data();
  const history = data?.history || [];
  
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  const recentHistory = history.filter((msg: any) => msg.timestamp >= twentyFourHoursAgo);
  
  return recentHistory.map((msg: any) => ({
    role: msg.role,
    parts: msg.parts
  }));
}

export async function getRawSessionHistory(companyId: string, sessionId: string) {
  const docId = `${companyId}_${sessionId}`;
  const doc = await getDb().collection('sessions').doc(docId).get();
  if (!doc.exists) return null;
  return doc.data();
}

export async function saveSessionMessage(
  companyId: string, 
  sessionId: string, 
  role: "user" | "model" | "human", 
  text: string,
  platform: "whatsapp" | "web" | "messenger" | "instagram" = "whatsapp",
  customerPhone?: string
) {
  const docId = `${companyId}_${sessionId}`;
  
  const newMessage = {
    role,
    parts: [{ text }],
    timestamp: Date.now()
  };

  const docRef = getDb().collection('sessions').doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    await docRef.set({
      companyId,
      sessionId,
      customerPhone: customerPhone || sessionId,
      platform,
      status: 'ai_handling', // Default status for new chats
      lastMessage: text,
      history: [newMessage],
      lastUpdated: new Date().toISOString(),
      updatedAt: Date.now()
    });
  } else {
    await docRef.update({
      history: FieldValue.arrayUnion(newMessage),
      lastMessage: text,
      lastUpdated: new Date().toISOString(),
      updatedAt: Date.now()
    });
  }
}

export async function updateSessionStatus(companyId: string, sessionId: string, status: "ai_handling" | "needs_human" | "human_handling") {
  const docId = `${companyId}_${sessionId}`;
  await getDb().collection('sessions').doc(docId).update({
    status,
    lastUpdated: new Date().toISOString(),
    updatedAt: Date.now()
  });
}

// --- ORDERS ---
export async function getOrders(companyId: string) {
  const snapshot = await getDb().collection('orders').where('companyId', '==', companyId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createOrder(companyId: string, customerId: string, items: any[], total: number) {
  const order = {
    companyId,
    customerId,
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  const docRef = await getDb().collection('orders').add(order);
  return { id: docRef.id, ...order };
}

// --- PAYMENTS ---
export async function getPayments(companyId: string) {
  const snapshot = await getDb().collection('payments').where('companyId', '==', companyId).orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function registerPayment(companyId: string, customerId: string, amount: number, reference: string, method: string = "SINPE Móvil") {
  const payment = {
    companyId,
    customerId,
    amount,
    reference,
    method,
    status: 'verified',
    createdAt: new Date().toISOString()
  };
  const docRef = await getDb().collection('payments').add(payment);
  return { id: docRef.id, ...payment };
}
