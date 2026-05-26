import { adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';

export let MOCK_COMPANIES: Record<string, any> = {
  "PIZZA_COMPANY": {
    id: "PIZZA_COMPANY",
    ownerId: "MOCK_USER_ID",
    name: "Luigi's Pizza",
    knowledgeBase: "We are Luigi's Pizza. We open from 11 AM to 10 PM. We do not offer gluten-free crusts. Delivery takes 30-45 minutes.",
    productsCatalog: "- Pepperoni Pizza: 6000 CRC\n- Hawaiian Pizza: 6500 CRC\n- Garlic Bread: 2000 CRC",
    calendlyLink: "https://calendly.com/luigis-pizza/table-reservation",
    persona: "You are Luigi, an energetic Italian chef. Use phrases like 'Mamma mia!' and 'Che buono!'"
  },
  "TOURISM_COMPANY": {
    id: "TOURISM_COMPANY",
    ownerId: "MOCK_USER_ID",
    name: "Tico Tours Costa Rica",
    knowledgeBase: "Tico Tours Costa Rica. We offer guided hikes, ziplining, and surfing lessons. Pick up is at 7 AM from most hotels. Cancellation requires 24h notice.",
    productsCatalog: "- Volcano Hike: $50 USD\n- Canopy Tour: $60 USD\n- Surf Lesson: $40 USD",
    calendlyLink: "https://calendly.com/tico-tours/book",
    persona: "You are a local Costa Rican tour guide. Very 'Pura vida', friendly, adventurous, use local slang casually."
  },
  "DOCTOR_COMPANY": {
    id: "DOCTOR_COMPANY",
    ownerId: "MOCK_USER_ID",
    name: "Dr. Maria Jimenez Clinic",
    knowledgeBase: "Dr. Maria Jimenez, General Practitioner. Clinic hours: 8 AM to 4 PM. We accept INS insurance. First consultation is $80. We do not do surgeries.",
    productsCatalog: "- General Checkup: $80 USD\n- Blood Test Review: $40 USD",
    calendlyLink: "https://calendly.com/dr-maria-jimenez/consultation",
    persona: "You are a professional, empathetic, and knowledgeable medical receptionist. Be very respectful and polite."
  },
  "DEMO_COMPANY": {
    id: "DEMO_COMPANY",
    ownerId: "MOCK_USER_ID",
    name: "Charlo Demo (Cafetería)",
    knowledgeBase: "Our business hours are 9 AM to 5 PM, Mon-Fri. We offer organic coffee and pastries.",
    productsCatalog: "- Cappuccino: 2000 CRC\n- Latte: 2500 CRC\n- Croissant: 1500 CRC",
    calendlyLink: "https://calendly.com/mock-business",
    persona: "Pura vida and very friendly, use Costa Rican slang."
  }
};

// --- BUSINESS CRUD ---
export async function getCompanies(userId: string) {
  if (!adminDb) {
    return Object.values(MOCK_COMPANIES).filter(c => c.ownerId === userId || !c.ownerId);
  }
  const snapshot = await adminDb.collection('companies').where('ownerId', '==', userId).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createCompany(companyData: any) {
  const id = `company_${Date.now()}`;
  const newCompany = { id, ...companyData, createdAt: new Date().toISOString() };
  
  if (!adminDb) {
    MOCK_COMPANIES[id] = newCompany;
    return newCompany;
  }
  
  await adminDb.collection('companies').doc(id).set(newCompany);
  return newCompany;
}

export async function updateCompany(companyId: string, companyData: any) {
  if (!adminDb) {
    if (MOCK_COMPANIES[companyId]) {
      MOCK_COMPANIES[companyId] = { ...MOCK_COMPANIES[companyId], ...companyData, lastUpdated: new Date().toISOString() };
      return MOCK_COMPANIES[companyId];
    }
    return null;
  }
  
  await adminDb.collection('companies').doc(companyId).update({
    ...companyData,
    lastUpdated: new Date().toISOString()
  });
  const doc = await adminDb.collection('companies').doc(companyId).get();
  return { id: doc.id, ...doc.data() };
}

export async function deleteCompany(companyId: string) {
  if (!adminDb) {
    delete MOCK_COMPANIES[companyId];
    return { success: true };
  }
  await adminDb.collection('companies').doc(companyId).delete();
  return { success: true };
}

// --- COMPANIES (TENANTS) ---
export async function getCompanyConfig(companyId: string) {
  if (!adminDb) return MOCK_COMPANIES[companyId] || MOCK_COMPANIES['DEMO_COMPANY'];
  const doc = await adminDb.collection('companies').doc(companyId).get();
  return doc.exists ? doc.data() : null;
}

export async function getCompanyByWhatsAppId(phoneId: string) {
  if (!adminDb) return MOCK_COMPANIES['DEMO_COMPANY'];
  const snapshot = await adminDb.collection('companies')
    .where('whatsappPhoneNumberId', '==', phoneId)
    .limit(1)
    .get();
  
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// --- KNOWLEDGE GAPS (QA) ---
export async function saveKnowledgeGap(companyId: string, gapData: any) {
  if (!adminDb) return;
  await adminDb.collection('companies').doc(companyId).collection('knowledge_gaps').add({
    ...gapData,
    status: 'pending',
    createdAt: new Date().toISOString()
  });
}

// --- CUSTOMERS (LONG-TERM CRM PROFILES) ---
export let MOCK_CUSTOMERS: Record<string, any> = {};

export async function getCustomersByCompany(companyId: string) {
  if (!adminDb) {
    return Object.values(MOCK_CUSTOMERS).filter(c => c.companyId === companyId);
  }
  const snapshot = await adminDb.collection('customers').where('companyId', '==', companyId).get();
  return snapshot.docs.map(doc => doc.data());
}

export async function getCustomerProfile(companyId: string, customerId: string) {
  const docId = `${companyId}_${customerId}`;
  
  if (!adminDb) {
    if (!MOCK_CUSTOMERS[docId]) {
      MOCK_CUSTOMERS[docId] = {
        companyId,
        customerId,
        extractedFacts: {},
        createdAt: new Date().toISOString()
      };
    }
    return MOCK_CUSTOMERS[docId];
  }

  const doc = await adminDb.collection('customers').doc(docId).get();
  
  if (!doc.exists) {
    const newProfile = {
      companyId,
      customerId,
      extractedFacts: {},
      createdAt: new Date().toISOString()
    };
    await adminDb.collection('customers').doc(docId).set(newProfile);
    return newProfile;
  }
  return doc.data();
}

export async function updateCustomerProfile(companyId: string, customerId: string, newFacts: any) {
  const docId = `${companyId}_${customerId}`;
  
  if (!adminDb) {
    MOCK_CUSTOMERS[docId] = {
      ...MOCK_CUSTOMERS[docId],
      extractedFacts: newFacts,
      lastUpdated: new Date().toISOString()
    };
    return;
  }

  await adminDb.collection('customers').doc(docId).set({
    extractedFacts: newFacts,
    lastUpdated: new Date().toISOString()
  }, { merge: true });
}

// --- SESSIONS (SHORT-TERM MEMORY) ---
export async function getSessionHistory(companyId: string, sessionId: string) {
  if (!adminDb) return [];
  const docId = `${companyId}_${sessionId}`;
  const doc = await adminDb.collection('sessions').doc(docId).get();
  
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
  if (!adminDb) return [];
  const docId = `${companyId}_${sessionId}`;
  const doc = await adminDb.collection('sessions').doc(docId).get();
  if (!doc.exists) return [];
  return doc.data()?.history || [];
}

export async function saveSessionMessage(companyId: string, sessionId: string, role: "user" | "model", text: string) {
  if (!adminDb) return;
  const docId = `${companyId}_${sessionId}`;
  
  const newMessage = {
    role,
    parts: [{ text }],
    timestamp: Date.now()
  };

  const docRef = adminDb.collection('sessions').doc(docId);
  const doc = await docRef.get();
  
  if (!doc.exists) {
    await docRef.set({
      companyId,
      sessionId,
      history: [newMessage],
      lastUpdated: new Date().toISOString()
    });
  } else {
    await docRef.update({
      history: FieldValue.arrayUnion(newMessage),
      lastUpdated: new Date().toISOString()
    });
  }
}
