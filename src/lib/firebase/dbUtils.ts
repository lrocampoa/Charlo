import { adminDb, adminAuth } from './admin';
import { sendAdminKnowledgeGapAlert } from '../email/service';
import { sendAdminWhatsAppAlert } from '../whatsapp/service';
import { FieldValue, Filter } from 'firebase-admin/firestore';

function getDb() {
  if (!adminDb) throw new Error("Firebase Admin DB is not initialized. Check server credentials.");
  return adminDb;
}

// --- BUSINESS CRUD ---
export async function getCompanies(userId: string) {
  const snapshot = await getDb().collection('companies').where(
    Filter.or(
      Filter.where('ownerId', '==', userId),
      Filter.where('teamMembers', 'array-contains', userId)
    )
  ).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createCompany(companyData: any) {
  const id = `company_${Date.now()}`;
  
  // Extract services if present so they don't pollute the root doc
  const { extractedServices, ...rootData } = companyData;
  
  const newCompany = { 
    id, 
    ...rootData, 
    teamMembers: [], 
    subscription: { tier: 'starter', currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    usage: { aiMessagesCurrentMonth: 0 },
    createdAt: new Date().toISOString() 
  };
  await getDb().collection('companies').doc(id).set(newCompany);
  
  // Save extracted services to subcollection if they exist
  if (extractedServices && Array.isArray(extractedServices)) {
    const batch = getDb().batch();
    extractedServices.forEach((service: any) => {
      const serviceRef = getDb().collection('companies').doc(id).collection('services').doc();
      batch.set(serviceRef, {
        name: service.name,
        description: service.description || '',
        price: service.price || 0,
        durationMinutes: service.durationMinutes || 60,
        capacity: service.capacity || 1,
        isActive: true,
        createdAt: new Date().toISOString()
      });
    });
    await batch.commit();
  }
  
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

// --- BILLING & USAGE TRACKING ---
export async function trackWhatsAppUsage(companyId: string) {
  try {
    await getDb().collection('companies').doc(companyId).update({
      'billing.whatsappMessagesUsed': FieldValue.increment(1),
      'billing.lastWhatsAppMessageAt': new Date().toISOString()
    });
  } catch (err) {
    console.error(`Failed to track WhatsApp usage for company ${companyId}`, err);
  }
}

export async function trackGeminiUsage(companyId: string, tokens: number) {
  try {
    await getDb().collection('companies').doc(companyId).update({
      'billing.geminiTokensUsed': FieldValue.increment(tokens),
      'usage.aiMessagesCurrentMonth': FieldValue.increment(1)
    });
  } catch (err) {
    console.error(`Failed to track Gemini usage for company ${companyId}`, err);
  }
}

// --- COMPANIES (TENANTS) ---
export async function getCompanyConfig(companyId: string): Promise<any> {
  const db = adminDb;
  if (!db) throw new Error("DB not initialized");
  
  const doc = await db.collection('companies').doc(companyId).get();
  if (!doc.exists) return null;
  
  const data = doc.data();

  // Fetch Services List
  const servicesSnapshot = await db.collection('companies').doc(companyId).collection('services').get();
  const servicesList = servicesSnapshot.docs.map(sDoc => ({ id: sDoc.id, ...sDoc.data() }));

  return { ...data, servicesList };
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

  // Try to send alerts
  try {
    const doc = await getDb().collection('companies').doc(companyId).get();
    if (doc.exists) {
      const companyConfig = doc.data();
      const ownerId = companyConfig?.ownerId;
      if (ownerId && adminAuth) {
        const userRecord = await adminAuth.getUser(ownerId);
        
        // Send email
        if (userRecord.email) {
          sendAdminKnowledgeGapAlert(userRecord.email, gapData).catch(err => console.error("Error triggering email alert:", err));
        }
        
        // Send WhatsApp if phone number exists
        const phoneNumber = userRecord.phoneNumber || companyConfig?.ownerPhone;
        if (phoneNumber) {
          sendAdminWhatsAppAlert(phoneNumber, gapData, companyConfig).catch(err => console.error("Error triggering WhatsApp alert:", err));
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch owner details for alerts:", err);
  }
}

export async function getKnowledgeGaps(companyId: string) {
  const snapshot = await getDb()
    .collection('companies')
    .doc(companyId)
    .collection('knowledge_gaps')
    .where('status', '==', 'pending')
    .orderBy('createdAt', 'desc')
    .get();
    
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateKnowledgeGap(companyId: string, gapId: string, updates: any) {
  await getDb()
    .collection('companies')
    .doc(companyId)
    .collection('knowledge_gaps')
    .doc(gapId)
    .update({
      ...updates,
      lastUpdated: new Date().toISOString()
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
  
  const normalizedHistory: any[] = [];
  for (const msg of recentHistory) {
    let role = msg.role === 'human' ? 'model' : msg.role;
    if (role !== 'user' && role !== 'model') role = 'user'; // fallback
    
    if (normalizedHistory.length > 0 && normalizedHistory[normalizedHistory.length - 1].role === role) {
      normalizedHistory[normalizedHistory.length - 1].parts[0].text += `\n${msg.parts[0].text}`;
    } else {
      normalizedHistory.push({ role, parts: [{ text: msg.parts[0].text || "" }] });
    }
  }
  
  return normalizedHistory;
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

export async function getCompanySessions(companyId: string) {
  const snapshot = await getDb()
    .collection('sessions')
    .where('companyId', '==', companyId)
    .get();
  
  return snapshot.docs.map(doc => doc.data());
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
  const snapshot = await getDb().collection('companies').doc(companyId).collection('payments').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function registerPayment(companyId: string, customerId: string, paymentData: any) {
  const payment = {
    companyId,
    customerId, // Phone number
    ...paymentData,
    status: 'verified',
    createdAt: new Date().toISOString()
  };
  const docRef = await getDb().collection('companies').doc(companyId).collection('payments').add(payment);
  return { id: docRef.id, ...payment };
}

// --- CAMPAIGNS ---
export async function saveCampaign(companyId: string, campaignData: any) {
  const docRef = await getDb().collection('companies').doc(companyId).collection('campaigns').add({
    ...campaignData,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...campaignData };
}

export async function getCampaigns(companyId: string) {
  const snapshot = await getDb().collection('companies').doc(companyId).collection('campaigns').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// --- DATA SOURCES (KNOWLEDGE BASE) ---
export async function getDataSources(companyId: string) {
  const snapshot = await getDb().collection('companies').doc(companyId).collection('data_sources').orderBy('createdAt', 'desc').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function saveDataSource(companyId: string, data: { name: string; type: string; extractedText: string }) {
  const docRef = await getDb().collection('companies').doc(companyId).collection('data_sources').add({
    ...data,
    createdAt: new Date().toISOString()
  });
  return { id: docRef.id, ...data };
}

export async function deleteDataSource(companyId: string, sourceId: string) {
  await getDb().collection('companies').doc(companyId).collection('data_sources').doc(sourceId).delete();
  return { success: true };
}

// --- TEAM INVITES ---
export async function generateInviteLink(companyId: string, createdBy: string) {
  const inviteRef = getDb().collection('invites').doc();
  const inviteData = {
    companyId,
    createdBy,
    role: 'member',
    status: 'active',
    createdAt: new Date().toISOString()
  };
  await inviteRef.set(inviteData);
  return { id: inviteRef.id, ...inviteData };
}

export async function acceptInvite(inviteId: string, userId: string) {
  const inviteRef = getDb().collection('invites').doc(inviteId);
  const inviteDoc = await inviteRef.get();
  
  if (!inviteDoc.exists) {
    throw new Error('Invite not found');
  }
  
  const inviteData = inviteDoc.data();
  if (inviteData?.status !== 'active') {
    throw new Error('Invite is no longer active');
  }
  
  const companyId = inviteData?.companyId;
  const companyRef = getDb().collection('companies').doc(companyId);
  
  // Add user to teamMembers
  await companyRef.update({
    teamMembers: FieldValue.arrayUnion(userId)
  });
  
  // Optional: Mark invite as used, or keep it active for multiple uses. 
  // For a general team link, keeping it active is often desired unless revoked.
  
  return { companyId, success: true };
}

